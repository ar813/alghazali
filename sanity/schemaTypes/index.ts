import { type SchemaTypeDefinition } from 'sanity'
import student from './student'
import schedule from './schedule'
import fees from './fees'
import notice from './notice'

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [student, schedule, fees, notice],
}
