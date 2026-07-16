import { describe, expect, it } from 'vitest';
import { isPermission } from './index';
describe('permissions', () => { it('recognizes the typed naming convention', () => { expect(isPermission('appointments.read')).toBe(true); expect(isPermission('patients.read')).toBe(false); }); });
