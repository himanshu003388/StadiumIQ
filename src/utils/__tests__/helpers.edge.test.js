import { describe, it, expect } from 'vitest';
import {
  timeAgo,
  getDemoResponse,
  renderMarkdown,
  getLoadBarColor,
  getDensityColor,
  getStatusColor,
  getSeverityColor,
  getCO2Color,
  getCapacityColor,
  generateXaiReasoning,
  generateGateReasoningLines,
  generateIncidentReasoning,
  validateDataset,
  parseDocumentOffline,
} from '../helpers';

describe('helpers edge cases', () => {
  describe('timeAgo', () => {
    it('returns "just now" for timestamps within 1 minute', () => {
      expect(timeAgo(new Date().toISOString())).toBe('just now');
    });

    it('returns minutes for timestamps within 1 hour', () => {
      const past = new Date(Date.now() - 5 * 60000).toISOString();
      expect(timeAgo(past)).toBe('5m ago');
    });

    it('returns hours for timestamps within 24 hours', () => {
      const past = new Date(Date.now() - 3 * 3600000).toISOString();
      expect(timeAgo(past)).toBe('3h ago');
    });

    it('returns days for timestamps older than 24 hours', () => {
      const past = new Date(Date.now() - 2 * 86400000).toISOString();
      expect(timeAgo(past)).toBe('2d ago');
    });
  });

  describe('getDemoResponse', () => {
    const mockCtx = {
      gates: [{ id: 'A', density: 0.3, waitTimeMinutes: 5, accessible: true, direction: 'North' }],
      transportOptions: [
        {
          id: 'TR1',
          type: 'Subway',
          line: 'Red Line',
          etaMinutes: 10,
          co2e: 5,
          capacityLeft: 200,
          recommended: true,
        },
      ],
      stadium: {
        name: 'Test',
        capacity: 100000,
        currentOccupancy: 50000,
        weather: { temperature: 25, feelsLike: 27, conditions: 'clear', humidity: 50 },
        sustainability: { co2SavedKg: 1000, renewablePercentage: 80, wasteDiversionRate: 60 },
      },
      accessibilityServices: [
        { type: 'Wheelchair', locations: ['Gate A'], description: 'Available' },
      ],
    };

    it('returns default response for unknown query', () => {
      const res = getDemoResponse('random text', mockCtx);
      expect(res).toContain('Test');
    });

    it('returns gate response for gate query', () => {
      const res = getDemoResponse('which gate to enter?', mockCtx);
      expect(res).toContain('Gate');
    });

    it('returns transport response', () => {
      const res = getDemoResponse('best transport option', mockCtx);
      expect(res).toContain('Subway');
    });

    it('returns weather response', () => {
      const res = getDemoResponse('temperature outside', mockCtx);
      expect(res).toContain('25');
    });

    it('returns crowd response', () => {
      const res = getDemoResponse('how busy is it?', mockCtx);
      expect(res).toContain('capacity');
    });

    it('returns eco response', () => {
      const res = getDemoResponse('carbon footprint?', mockCtx);
      expect(res).toContain('CO₂');
    });

    it('returns accessibility response', () => {
      const res = getDemoResponse('wheelchair accessible?', mockCtx);
      expect(res).toContain('Accessibility');
    });

    it('returns food response', () => {
      const res = getDemoResponse('food nearby', mockCtx);
      expect(res).toContain('Food');
    });

    it('returns parking response', () => {
      const res = getDemoResponse('parking lot', mockCtx);
      expect(res).toContain('Parking');
    });

    it('returns merch response', () => {
      const res = getDemoResponse('merchandise store', mockCtx);
      expect(res).toContain('Merchandise');
    });

    it('returns Spanish response', () => {
      const res = getDemoResponse('hola', mockCtx, 'es');
      expect(res).toContain('Bienvenido');
    });
  });

  describe('renderMarkdown', () => {
    it('renders bold text', () => {
      expect(renderMarkdown('**hello**')).toContain('<strong>hello</strong>');
    });

    it('renders bullet points', () => {
      const result = renderMarkdown('• item 1\n• item 2');
      expect(result).toContain('<ul');
      expect(result).toContain('<li>item 1</li>');
    });

    it('handles line breaks', () => {
      const result = renderMarkdown('line1\nline2');
      expect(result).toContain('<br/>');
    });
  });

  describe('getLoadBarColor', () => {
    it('returns critical for full load', () => {
      expect(getLoadBarColor(5, 5)).toBe('var(--color-status-critical)');
    });

    it('returns busy for high load', () => {
      expect(getLoadBarColor(3, 5)).toBe('var(--color-status-busy)');
    });

    it('returns nominal for low load', () => {
      expect(getLoadBarColor(1, 5)).toBe('var(--color-status-nominal)');
    });
  });

  describe('getDensityColor', () => {
    it('returns critical for high density', () => {
      expect(getDensityColor(0.9)).toBe('var(--color-status-critical)');
    });

    it('returns busy for medium density', () => {
      expect(getDensityColor(0.7)).toBe('var(--color-status-busy)');
    });

    it('returns nominal for low density', () => {
      expect(getDensityColor(0.5)).toBe('var(--color-status-nominal)');
    });
  });

  describe('getStatusColor', () => {
    it('returns critical color for critical status', () => {
      expect(getStatusColor('critical')).toBe('var(--color-status-critical)');
    });

    it('returns busy color for watch status', () => {
      expect(getStatusColor('watch')).toBe('var(--color-status-busy)');
    });

    it('returns nominal for normal status', () => {
      expect(getStatusColor('normal')).toBe('var(--color-status-nominal)');
    });

    it('returns nominal for unknown status', () => {
      expect(getStatusColor('unknown')).toBe('var(--color-status-nominal)');
    });

    it('returns nominal for empty string', () => {
      expect(getStatusColor('')).toBe('var(--color-status-nominal)');
    });
  });

  describe('getSeverityColor', () => {
    it('returns error color for critical severity', () => {
      expect(getSeverityColor('critical')).toBe('var(--color-error)');
    });

    it('returns warning color for medium severity', () => {
      expect(getSeverityColor('medium')).toBe('var(--color-warning)');
    });

    it('returns info color for low severity', () => {
      expect(getSeverityColor('low')).toBe('var(--color-info)');
    });

    it('returns info color for undefined severity', () => {
      expect(getSeverityColor(undefined)).toBe('var(--color-info)');
    });

    it('returns info color for null severity', () => {
      expect(getSeverityColor(null)).toBe('var(--color-info)');
    });
  });

  describe('getCO2Color', () => {
    it('returns success color for zero emissions', () => {
      expect(getCO2Color(0)).toBe('var(--color-success)');
    });

    it('returns tertiary color for emissions <= 10', () => {
      expect(getCO2Color(1)).toBe('var(--color-tertiary)');
      expect(getCO2Color(10)).toBe('var(--color-tertiary)');
    });

    it('returns secondary color for emissions <= 20', () => {
      expect(getCO2Color(11)).toBe('var(--color-secondary-container)');
      expect(getCO2Color(20)).toBe('var(--color-secondary-container)');
    });

    it('returns warning color for emissions <= 40', () => {
      expect(getCO2Color(21)).toBe('var(--color-warning)');
      expect(getCO2Color(40)).toBe('var(--color-warning)');
    });

    it('returns error color for emissions > 40', () => {
      expect(getCO2Color(41)).toBe('var(--color-error)');
      expect(getCO2Color(100)).toBe('var(--color-error)');
    });

    it('treats negative values as <= 10 due to comparison order', () => {
      expect(getCO2Color(-1)).toBe('var(--color-tertiary)');
    });
  });

  describe('getCapacityColor', () => {
    it('returns error when seatsLeft is 0', () => {
      expect(getCapacityColor(0)).toBe('var(--color-error)');
    });

    it('returns error when seatsLeft <= 5', () => {
      expect(getCapacityColor(5)).toBe('var(--color-error)');
    });

    it('returns warning when seatsLeft is between 6 and 20', () => {
      expect(getCapacityColor(6)).toBe('var(--color-warning)');
      expect(getCapacityColor(20)).toBe('var(--color-warning)');
    });

    it('returns success when seatsLeft > 20', () => {
      expect(getCapacityColor(21)).toBe('var(--color-success)');
      expect(getCapacityColor(100)).toBe('var(--color-success)');
    });
  });

  describe('generateXaiReasoning', () => {
    const gates = [
      { id: 'A', density: 0.3, waitTimeMinutes: 5 },
      { id: 'B', density: 0.8, waitTimeMinutes: 20 },
      { id: 'C', density: 0.5, waitTimeMinutes: 12 },
    ];

    it('returns empty string for null input', () => {
      expect(generateXaiReasoning(null)).toBe('');
    });

    it('returns empty string for undefined input', () => {
      expect(generateXaiReasoning(undefined)).toBe('');
    });

    it('returns empty string for empty array', () => {
      expect(generateXaiReasoning([])).toBe('');
    });

    it('returns empty string for single gate', () => {
      expect(generateXaiReasoning([{ id: 'A', density: 0.5, waitTimeMinutes: 10 }])).toBe('');
    });

    it('returns reasoning for multiple gates', () => {
      const result = generateXaiReasoning(gates);
      expect(result).toContain('Gate B');
      expect(result).toContain('Gate A');
      expect(result).toContain('saves');
    });

    it('handles gates with identical densities', () => {
      const same = [
        { id: 'A', density: 0.5, waitTimeMinutes: 10 },
        { id: 'B', density: 0.5, waitTimeMinutes: 10 },
      ];
      const result = generateXaiReasoning(same);
      expect(result).toContain('Gate');
      expect(result).toContain('saves ~0 min');
    });
  });

  describe('generateGateReasoningLines', () => {
    const gates = [
      { id: 'A', density: 0.3, waitTimeMinutes: 5 },
      { id: 'B', density: 0.8, waitTimeMinutes: 20 },
      { id: 'C', density: 0.5, waitTimeMinutes: 12 },
    ];

    it('returns empty array for null input', () => {
      expect(generateGateReasoningLines(null)).toEqual([]);
    });

    it('returns empty array for undefined input', () => {
      expect(generateGateReasoningLines(undefined)).toEqual([]);
    });

    it('returns empty array for empty gates', () => {
      expect(generateGateReasoningLines([])).toEqual([]);
    });

    it('returns empty array for single gate', () => {
      expect(generateGateReasoningLines([{ id: 'A', density: 0.5, waitTimeMinutes: 10 }])).toEqual(
        [],
      );
    });

    it('returns reasoning lines for multiple gates', () => {
      const result = generateGateReasoningLines(gates);
      expect(result.length).toBeGreaterThan(0);
      result.forEach((line) => {
        expect(line).toHaveProperty('gateId');
        expect(line).toHaveProperty('text');
      });
    });

    it('excludes the best gate from result', () => {
      const result = generateGateReasoningLines(gates);
      const bestGateIds = result.map((r) => r.gateId);
      expect(bestGateIds).not.toContain('A');
    });
  });

  describe('generateIncidentReasoning', () => {
    const volunteers = [
      {
        name: 'Alice',
        zone: 'North',
        currentLoad: 2,
        maxLoad: 5,
        skills: ['first-aid', 'crowd-control'],
      },
      { name: 'Bob', zone: 'South', currentLoad: 5, maxLoad: 5, skills: ['security'] },
      { name: 'Carol', zone: 'East', currentLoad: 0, maxLoad: 5, skills: ['guest-services'] },
    ];

    it('returns empty string when incident is null', () => {
      expect(generateIncidentReasoning(null, volunteers)).toBe('');
    });

    it('returns empty string when volunteers is null', () => {
      expect(generateIncidentReasoning({ type: 'medical' }, null)).toBe('');
    });

    it('returns empty string when both are null', () => {
      expect(generateIncidentReasoning(null, null)).toBe('');
    });

    it('returns at-capacity message when volunteers is empty array', () => {
      const result = generateIncidentReasoning({ type: 'medical' }, []);
      expect(result).toBe('All volunteers at capacity — escalate to secondary dispatch.');
    });

    it('returns at-capacity message when all volunteers are fully loaded', () => {
      const busy = [
        { name: 'Alice', zone: 'North', currentLoad: 5, maxLoad: 5, skills: ['first-aid'] },
        { name: 'Bob', zone: 'South', currentLoad: 5, maxLoad: 5, skills: ['security'] },
      ];
      const result = generateIncidentReasoning({ type: 'medical', zone: 'North Stand' }, busy);
      expect(result).toBe('All volunteers at capacity — escalate to secondary dispatch.');
    });

    it('returns best available volunteer when incident has matching zone', () => {
      const result = generateIncidentReasoning({ type: 'crowd', zone: 'North Stand' }, volunteers);
      expect(result).toContain('Alice');
      expect(result).toContain('North');
    });

    it('returns dispatch string even for bare-minimum volunteer', () => {
      const bare = [{ name: 'Dave', zone: 'West', currentLoad: 0, maxLoad: 5, skills: [] }];
      const result = generateIncidentReasoning(
        { type: 'unknown-type', zone: 'Unknown Zone' },
        bare,
      );
      expect(result).toContain('Dave');
      expect(result).toContain('West');
    });
  });

  describe('validateDataset', () => {
    it('returns error for null input', () => {
      const errors = validateDataset(null);
      expect(errors).toEqual(['Invalid dataset: must be a JSON object.']);
    });

    it('returns error for undefined input', () => {
      const errors = validateDataset(undefined);
      expect(errors).toEqual(['Invalid dataset: must be a JSON object.']);
    });

    it('returns error for string input', () => {
      const errors = validateDataset('not an object');
      expect(errors).toEqual(['Invalid dataset: must be a JSON object.']);
    });

    it('treats array as valid shape but reports missing keys', () => {
      const errors = validateDataset([]);
      expect(errors).toContain(
        'Dataset must contain at least one of: gates, incidents, volunteers.',
      );
    });

    it('returns error when no known keys are present', () => {
      const errors = validateDataset({ foo: 'bar' });
      expect(errors).toContain(
        'Dataset must contain at least one of: gates, incidents, volunteers.',
      );
    });

    it('validates gates array with missing ids', () => {
      const errors = validateDataset({
        gates: [{ density: 0.5, waitTimeMinutes: 10 }],
        incidents: [],
        volunteers: [],
      });
      expect(errors).toContain('gates[0]: missing id');
    });

    it('validates gates with invalid density range', () => {
      const errors = validateDataset({
        gates: [{ id: 'A', density: 1.5, waitTimeMinutes: 10 }],
        incidents: [],
        volunteers: [],
      });
      expect(errors).toContain('gates[0]: density must be 0–1');
    });

    it('validates gates with non-numeric waitTimeMinutes', () => {
      const errors = validateDataset({
        gates: [{ id: 'A', density: 0.5, waitTimeMinutes: 'ten' }],
        incidents: [],
        volunteers: [],
      });
      expect(errors).toContain('gates[0]: waitTimeMinutes must be a number');
    });

    it('validates incidents with missing id and type', () => {
      const errors = validateDataset({
        gates: [],
        incidents: [{ severity: 'high' }],
        volunteers: [],
      });
      expect(errors).toContain('incidents[0]: missing id');
      expect(errors).toContain('incidents[0]: missing type');
    });

    it('validates volunteers with missing name', () => {
      const errors = validateDataset({
        gates: [],
        incidents: [],
        volunteers: [{ id: 'V1' }],
      });
      expect(errors).toContain('volunteers[0]: missing name');
    });

    it('reports gates as non-array when gates is an object', () => {
      const errors = validateDataset({
        gates: { id: 'A' },
        incidents: [],
        volunteers: [],
      });
      expect(errors).toContain('gates must be an array.');
    });

    it('reports incidents as non-array when incidents is a string', () => {
      const errors = validateDataset({
        gates: [],
        incidents: 'bad data',
        volunteers: [],
      });
      expect(errors).toContain('incidents must be an array.');
    });

    it('returns no errors for valid dataset', () => {
      const errors = validateDataset({
        gates: [{ id: 'A', density: 0.5, waitTimeMinutes: 10 }],
        incidents: [{ id: 'INC-1', type: 'medical' }],
        volunteers: [{ id: 'V1', name: 'Alice' }],
      });
      expect(errors).toHaveLength(0);
    });
  });

  describe('parseDocumentOffline', () => {
    it('parses CSV gates correctly', () => {
      const csv = `Gate,A,0.95,32,true,North,wheelchair-ramp;hearing-loop`;
      const res = parseDocumentOffline(csv, 'gates.csv');
      expect(res.gates).toHaveLength(1);
      expect(res.gates[0]).toEqual({
        id: 'A',
        density: 0.95,
        waitTimeMinutes: 32,
        status: 'critical',
        accessible: true,
        direction: 'North',
        accessibleFeatures: ['wheelchair-ramp', 'hearing-loop'],
      });
    });

    it('parses CSV incidents correctly', () => {
      const csv = `INC-101,medical,South Stand,high,Fan reported exhaustion,active,Deploy volunteer V1`;
      const res = parseDocumentOffline(csv, 'incidents.csv');
      expect(res.incidents).toHaveLength(1);
      expect(res.incidents[0].id).toBe('INC-101');
      expect(res.incidents[0].type).toBe('medical');
      expect(res.incidents[0].zone).toBe('South Stand');
      expect(res.incidents[0].severity).toBe('high');
      expect(res.incidents[0].description).toBe('Fan reported exhaustion');
      expect(res.incidents[0].status).toBe('active');
      expect(res.incidents[0].aiRecommendedAction).toBe('Deploy volunteer V1');
    });

    it('parses CSV volunteers correctly', () => {
      const csv = `V7,Carlos Gomez,North Stand,en;es,first-aid;crowd-control`;
      const res = parseDocumentOffline(csv, 'volunteers.csv');
      expect(res.volunteers).toHaveLength(1);
      expect(res.volunteers[0].id).toBe('V7');
      expect(res.volunteers[0].name).toBe('Carlos Gomez');
      expect(res.volunteers[0].zone).toBe('North Stand');
      expect(res.volunteers[0].languages).toEqual(['en', 'es']);
      expect(res.volunteers[0].skills).toEqual(['first-aid', 'crowd-control']);
    });

    it('extracts gates from text via regex fallback', () => {
      const text = `The density at Gate A is 90% right now. Also Gate B is 45%.`;
      const res = parseDocumentOffline(text, 'report.txt');
      expect(res.gates).toHaveLength(2);
      expect(res.gates[0].id).toBe('A');
      expect(res.gates[0].density).toBe(0.9);
      expect(res.gates[1].id).toBe('B');
      expect(res.gates[1].density).toBe(0.45);
    });

    it('extracts incidents from text via keyword fallback', () => {
      const text = `We have an injured fan in the south stand and a scanner offline.`;
      const res = parseDocumentOffline(text, 'report.txt');
      expect(res.incidents).toHaveLength(2);
      expect(res.incidents.map((i) => i.type)).toContain('medical');
      expect(res.incidents.map((i) => i.type)).toContain('equipment');
    });
  });
});
