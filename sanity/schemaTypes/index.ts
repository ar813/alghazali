import { type SchemaTypeDefinition } from 'sanity'
import student from './student'
import schedule from './schedule'
import fees from './fees'

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [student, schedule, fees],
}
