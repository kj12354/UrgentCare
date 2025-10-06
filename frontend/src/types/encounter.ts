import { ID } from './index'
export interface Encounter { id: ID; patientId: ID; startedAt: string; transcript?: string; soapNote?: string; icdCodes: string[] }
