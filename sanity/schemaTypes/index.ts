import { type SchemaTypeDefinition } from 'sanity'
import student from './student'
import schedule from './schedule'
import fees from './fees'
import notice from './notice'
import quiz from './quiz'
import quizResult from './quizResult'
import importantButRare from './importantButRare'

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [student, schedule, fees, notice, quiz, quizResult, importantButRare],
}
