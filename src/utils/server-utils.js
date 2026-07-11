/**
 * Stadium IQ - Shared server utilities
 * Pure functions extracted from server.js for reuse in testing.
 */
import crypto from 'crypto';
import { JSDOM } from 'jsdom';
import DOMPurify from 'dompurify';

const window = new JSDOM('').window;
const purify = DOMPurify(window);

// =========================================
// SECURITY: HMAC-signed CSRF tokens
// Stateless — survives server restarts & scales across instances
// =========================================
const CSRF_SECRET =
  process.env.CSRF_SECRET ||
  (process.env.GEMINI_API_KEY
    ? crypto.createHash('sha256').update(process.env.GEMINI_API_KEY).digest('hex')
    : 'default-stateless-csrf-secret-fallback');
const CSRF_TOKEN_EXPIRY = 3600; // seconds

function generateCsrfToken() {
  const payload = `${Date.now()}:${crypto.randomBytes(16).toString('hex')}`;
  const sig = crypto.createHmac('sha256', CSRF_SECRET).update(payload).digest('hex');
  return Buffer.from(`${payload}:${sig}`).toString('base64url');
}

function validateCsrfToken(rawToken) {
  if (!rawToken) return false;
  try {
    const decoded = Buffer.from(rawToken, 'base64url').toString();
    const [ts, nonce, sig] = decoded.split(':');
    if (!ts || !nonce || !sig) return false;
    const payload = `${ts}:${nonce}`;
    const expected = crypto.createHmac('sha256', CSRF_SECRET).update(payload).digest('hex');
    const sigBuf = Buffer.from(sig, 'hex');
    const expBuf = Buffer.from(expected, 'hex');
    if (sigBuf.length !== expBuf.length) return false;
    if (!crypto.timingSafeEqual(sigBuf, expBuf)) return false;
    if ((Date.now() - parseInt(ts, 10)) / 1000 > CSRF_TOKEN_EXPIRY) return false;
    return true;
  } catch {
    return false;
  }
}

// =========================================
// SECURITY: Input validation
// =========================================
const VALID_LANGUAGES = ['en', 'es', 'fr', 'ar', 'pt', 'ja', 'hi'];

function validateChatInput(body) {
  const errors = [];
  if (!body || typeof body !== 'object') {
    errors.push('Request body is required');
    return errors;
  }
  if (body.message !== undefined) {
    if (typeof body.message !== 'string') {
      errors.push('message must be a string');
    } else if (body.message.length > 2000) {
      errors.push('message must be max 2000 characters');
    } else if (body.message.trim().length === 0) {
      errors.push('message cannot be empty');
    }
  }
  if (body.language !== undefined) {
    if (!VALID_LANGUAGES.includes(body.language)) {
      errors.push('language must be a valid 2-letter ISO code');
    }
  }
  if (body.contextData !== undefined) {
    if (typeof body.contextData !== 'object') {
      errors.push('contextData must be an object');
    } else {
      const MAX_FIELD_LEN = 200;
      const stadium = body.contextData?.stadium;
      if (stadium) {
        if (typeof stadium.name === 'string' && stadium.name.length > MAX_FIELD_LEN)
          errors.push('contextData.stadium.name exceeds maximum length');
        if (typeof stadium.homeTeam === 'string' && stadium.homeTeam.length > MAX_FIELD_LEN)
          errors.push('contextData.stadium.homeTeam exceeds maximum length');
        if (typeof stadium.awayTeam === 'string' && stadium.awayTeam.length > MAX_FIELD_LEN)
          errors.push('contextData.stadium.awayTeam exceeds maximum length');
        if (typeof stadium.matchPhase === 'string' && stadium.matchPhase.length > 20)
          errors.push('contextData.stadium.matchPhase exceeds maximum length');
      }
    }
  }
  return errors;
}

// =========================================
// XSS Sanitization helper
// =========================================
function sanitizeInput(input) {
  const clean = purify.sanitize(input ?? '');
  return clean
    .replace(/\b(?:javascript|vbscript|data|file|blob)\s*:/gi, '')
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/[<>"'`]/g, '')
    .trim();
}

// =========================================
// SECURITY: Safe context filter
// Only sends whitelisted, non-sensitive fields to the AI API
// =========================================
function buildSafeContext(rawCtx) {
  if (!rawCtx || typeof rawCtx !== 'object') return {};
  return {
    stadium: {
      name: rawCtx.stadium?.name,
      capacity: rawCtx.stadium?.capacity,
      currentOccupancy: rawCtx.stadium?.currentOccupancy,
      homeTeam: rawCtx.stadium?.homeTeam,
      awayTeam: rawCtx.stadium?.awayTeam,
      score: rawCtx.stadium?.score,
      matchPhase: rawCtx.stadium?.matchPhase,
      weather: rawCtx.stadium?.weather,
      sustainability: rawCtx.stadium?.sustainability
        ? {
            energyDrawMW: rawCtx.stadium.sustainability.energyDrawMW,
            waterUsageKLH: rawCtx.stadium.sustainability.waterUsageKLH,
            wasteDiversionRate: rawCtx.stadium.sustainability.wasteDiversionRate,
            renewablePercentage: rawCtx.stadium.sustainability.renewablePercentage,
            netZeroProgress: rawCtx.stadium.sustainability.netZeroProgress,
            ecoModeActive: rawCtx.stadium.sustainability.ecoModeActive,
            co2SavedKg: rawCtx.stadium.sustainability.co2SavedKg,
            solarPanelsMW: rawCtx.stadium.sustainability.solarPanelsMW,
            trashBins: Array.isArray(rawCtx.stadium.sustainability.trashBins)
              ? rawCtx.stadium.sustainability.trashBins.map((b) => ({
                  zone: b.zone,
                  fullness: b.fullness,
                }))
              : [],
          }
        : undefined,
    },
    gates: Array.isArray(rawCtx.gates)
      ? rawCtx.gates.map((g) => ({
          id: g.id,
          direction: g.direction,
          density: g.density,
          waitTimeMinutes: g.waitTimeMinutes,
          status: g.status,
          accessible: g.accessible,
          accessibleFeatures: Array.isArray(g.accessibleFeatures) ? g.accessibleFeatures : [],
          cctvCongestionIndex:
            g.cctvCongestionIndex !== undefined
              ? g.cctvCongestionIndex
              : parseFloat((g.density * 0.95).toFixed(2)),
          flowRatePerMin:
            g.flowRatePerMin !== undefined ? g.flowRatePerMin : Math.round(g.density * 60 + 10),
          historicalPeakWaitMinutes:
            g.historicalPeakWaitMinutes !== undefined
              ? g.historicalPeakWaitMinutes
              : Math.round(g.waitTimeMinutes * 1.2 + 5),
        }))
      : [],
    incidents: Array.isArray(rawCtx.incidents)
      ? rawCtx.incidents
          .filter((i) => i.status === 'active')
          .slice(0, 10)
          .map((i) => ({ id: i.id, type: i.type, severity: i.severity, location: i.location }))
      : [],
    activeIncidentCount: Array.isArray(rawCtx.incidents)
      ? rawCtx.incidents.filter((i) => i.status === 'active').length
      : 0,
    volunteers: Array.isArray(rawCtx.volunteers)
      ? rawCtx.volunteers.map((v) => ({
          id: v.id,
          name: v.name,
          zone: v.zone,
          languages: Array.isArray(v.languages) ? v.languages : [],
          skills: Array.isArray(v.skills) ? v.skills : [],
          currentLoad: v.currentLoad,
          maxLoad: v.maxLoad,
          status: v.status,
        }))
      : [],
  };
}

// =========================================
function buildSystemPrompt(safeContext, userProfile = null) {
  let profileInstruction = '';
  if (userProfile) {
    profileInstruction = `\nCRITICAL DYNAMIC USER PROFILE ADAPTATION:
- User Dialect/Origin: ${userProfile.origin || 'Not specified'}
- Desired Tone Register: ${userProfile.tone || 'Culturally Appropriate'}
If responding in Arabic and user origin is Morocco, you MUST adapt vocabulary, phrasing, and greetings to Moroccan Arabic.
If the tone register is "Direct & Urgent", omit conversational pleasantries, use short bullet points, and prioritize quick action directions.
If the tone register is "Empathetic", use a reassuring, calm, and supportive tone.
Otherwise, maintain culturally appropriate, respectful, and standard dialect phrasings.\n`;
  }

  return `You are the Expert Generative AI Operations advisor for the FIFA World Cup 2026 Smart Stadium Command Center.
Your primary user is Alex, the Stressed Operations Manager (Control Room Operator), who relies on your quick, reasoning-backed intelligence to handle incidents, routing, and crowd safety.
${profileInstruction}

CRITICAL ASSISTANCE GUIDELINES:
1. EXPLAINABLE REASONING (XAI): Do not just retrieve or state facts. Provide clear, reasoning-backed recommendations.
   - For Egress/Navigation: Combine live crowd densities and gate wait times. Explain WHY a route is recommended (e.g. "Divert 20% of fans from Gate A to Gate B because Gate A is currently at 92% capacity with a 28m bottleneck, which saves fans 15 minutes of transit travel time").
   - For Volunteer Dispatch: Match volunteers dynamically to incidents based on proximity (zone), languages, skills, and workload. Suggest the specific volunteer and explain why they are selected.
   - For Sustainability/Cleaning: Monitor simulated trash bin levels. Suggest dynamic cleaning crew routing to zones with high fullness (e.g. "Send Yuki Tanaka to East Wing because trash bins there have hit 88% capacity, preventing overflow in public concourses").
2. TONE & REGISTER: Adjust tone based on severity. For normal inquiries, remain professional, concise, and helpful. For medical or critical safety emergencies, use an authoritative, calm, urgent, and precise tone, giving clear action steps.
3. CONCISENESS: Alex is under pressure. Keep responses highly actionable, structured with clear headings or bullet points, and free of fluff.
 4. MULTILINGUAL TONE (not literal translation): If requested in another language, adapt tone and formality to typical cultural communication norms for that language (e.g., more formal register for Japanese/Arabic, warmer casual tone for Portuguese/Spanish). Keep meaning identical, adapt phrasing style only — do NOT perform word-for-word translation.
 
 You have access to the current stadium operational context provided below.
 
 Current Stadium Context:
 ${safeContext}`;
}

export {
  sanitizeInput,
  validateChatInput,
  buildSafeContext,
  buildSystemPrompt,
  generateCsrfToken,
  validateCsrfToken,
  VALID_LANGUAGES,
  CSRF_SECRET,
};
