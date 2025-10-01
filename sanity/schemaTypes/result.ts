import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'result',
  title: 'Manual Result',
  type: 'document',
  fields: [
    defineField({ name: 'student', title: 'Student', type: 'reference', to: [{ type: 'student' }], validation: r => r.required() }),
    defineField({ name: 'examTitle', title: 'Exam Title', type: 'string', validation: r => r.required() }),
    defineField({ name: 'maxMarksPerSubject', title: 'Max Marks (per subject)', type: 'number' }),
    defineField({ name: 'minPassPercentage', title: 'Min Pass Percentage', type: 'number' }),
    defineField({ name: 'studentName', title: 'Student Name', type: 'string' }),
    defineField({ name: 'fatherName', title: "Father's Name", type: 'string' }),
    defineField({ name: 'rollNumber', title: 'Roll Number', type: 'string' }),
    defineField({ name: 'grNumber', title: 'GR Number', type: 'string' }),
    defineField({ name: 'className', title: 'Class', type: 'string', validation: r => r.required() }),
    defineField({ name: 'subjects', title: 'Subjects', type: 'array', of: [{ type: 'string' }], validation: r => r.min(1) }),
    defineField({ name: 'marks', title: 'Marks (per subject)', type: 'array', of: [{ type: 'number' }], validation: r => r.min(1) }),
    defineField({ name: 'percentage', title: 'Percentage', type: 'number' }),
    defineField({ name: 'grade', title: 'Grade', type: 'string' }),
    defineField({ name: 'remarks', title: 'Remarks', type: 'string' }),
    defineField({ name: 'createdAt', title: 'Created At', type: 'datetime', initialValue: () => new Date().toISOString() }),
  ],
})
