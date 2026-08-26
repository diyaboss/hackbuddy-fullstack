import express from 'express';
import { db } from '../db/index.js';
import { requireAuth, requireProfileComplete } from '../middleware/auth.js';

const router = express.Router();

function calculateComplementScore(currentUserProfile, candidateProfile, currentLookingFor, candidateSkills, currentSkills, candidateLookingFor) {
  let score = 0;
  let reasons = [];

  const theirSkillsYouNeed = candidateSkills.filter(s => currentLookingFor.includes(s));
  const yourSkillsTheyNeed = currentSkills.filter(s => candidateLookingFor.includes(s));

  if (theirSkillsYouNeed.length > 0) {
    score += theirSkillsYouNeed.length * 20;
    reasons.push(`They bring ${theirSkillsYouNeed.join(', ')}, which your team is missing.`);
  }

  if (yourSkillsTheyNeed.length > 0) {
    score += yourSkillsTheyNeed.length * 20;
    reasons.push(`You have ${yourSkillsTheyNeed.join(', ')} that they are looking for.`);
  }

  // Cap score at 100 for display purposes (or leave raw if preferred, but a percentage is nice)
  score = Math.min(score, 100);

  if (score === 0) {
    score = 10; // Baseline
    reasons.push('Could be an interesting wildcard match.');
  }

  return { score, reasons };
}

router.get('/', requireAuth, requireProfileComplete, (req, res) => {
  const genderFilter = req.query.gender || 'Everyone';
  const currentUserId = req.user.id;

  // Check if current user is active
  const currentUserProfile = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(currentUserId);
  if (currentUserProfile.matching_status !== 'active') {
    return res.json([]);
  }

  // Find users who are active, complete profiles, not admins, and not the current user
  let query = `
    SELECT p.* FROM profiles p
    JOIN users u ON p.user_id = u.id
    WHERE p.user_id != ? 
      AND p.matching_status = 'active'
      AND p.profile_complete = 1
      AND u.role = 'user'
  `;
  
  const params = [currentUserId];

  if (genderFilter !== 'Everyone') {
    query += ` AND p.gender = ?`;
    params.push(genderFilter);
  }
  
  // Exclude users already interacted with (pending/accepted/declined requests or matched)
  query += `
    AND p.user_id NOT IN (
      SELECT receiver_id FROM team_requests WHERE sender_id = ?
      UNION
      SELECT sender_id FROM team_requests WHERE receiver_id = ? AND status IN ('accepted', 'declined')
      UNION
      SELECT user_b_id FROM matches WHERE user_a_id = ?
      UNION
      SELECT user_a_id FROM matches WHERE user_b_id = ?
    )
  `;
  params.push(currentUserId, currentUserId, currentUserId, currentUserId);

  const candidates = db.prepare(query).all(...params);

  if (candidates.length === 0) {
    return res.json([]);
  }

  const currentSkills = db.prepare('SELECT skill FROM profile_skills WHERE user_id = ?').all(currentUserId).map(r => r.skill);
  const currentLookingFor = db.prepare('SELECT skill FROM profile_looking_for WHERE user_id = ?').all(currentUserId).map(r => r.skill);

  const enrichedCandidates = candidates.map(candidate => {
    const candidateSkills = db.prepare('SELECT skill FROM profile_skills WHERE user_id = ?').all(candidate.user_id).map(r => r.skill);
    const candidateLookingFor = db.prepare('SELECT skill FROM profile_looking_for WHERE user_id = ?').all(candidate.user_id).map(r => r.skill);

    const { score, reasons } = calculateComplementScore(
      currentUserProfile, candidate,
      currentLookingFor, candidateSkills,
      currentSkills, candidateLookingFor
    );

    return {
      id: candidate.user_id,
      name: candidate.name,
      branch: candidate.branch,
      year: candidate.year,
      bio: candidate.bio,
      avatar: candidate.avatar,
      working_style: candidate.working_style,
      skills: candidateSkills,
      lookingFor: candidateLookingFor,
      complementScore: score,
      complementReasons: reasons
    };
  });

  // Sort by score descending
  enrichedCandidates.sort((a, b) => b.complementScore - a.complementScore);

  res.json(enrichedCandidates);
});

export default router;
