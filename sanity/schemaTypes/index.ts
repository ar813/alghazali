import { type SchemaTypeDefinition } from 'sanity'
import student from './student'
import schedule from './schedule'

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [student, schedule],
}
