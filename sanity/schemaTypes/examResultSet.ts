import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'examResultSet',
  title: 'Exam Result Set',
  type: 'document',
  fields: [
    defineField({ name: 'examTitle', title: 'Exam Title', type: 'string', validation: r => r.required() }),
    defineField({ name: 'session', title: 'Academic Session', type: 'string', initialValue: '2024-2025' }),
    defineField({ name: 'className', title: 'Class', type: 'string', validation: r => r.required() }),
    defineField({ name: 'subjects', title: 'Subjects', type: 'array', of: [{ type: 'string' }], validation: r => r.min(1) }),
    defineField({ name: 'maxMarksPerSubject', title: 'Max Marks (per subject)', type: 'number' }),
    defineField({ name: 'minMarksPerSubject', title: 'Min Marks (per subject)', type: 'number' }),
    defineField({
      name: 'students',
      title: 'Students',
      type: 'array',
      of: [
        defineField({
          name: 'studentResult',
          type: 'object',
          fields: [
            defineField({ name: 'student', title: 'Student', type: 'reference', to: [{ type: 'student' }], validation: r => r.required() }),
            defineField({ name: 'studentName', title: 'Student Name', type: 'string' }),
            defineField({ name: 'fatherName', title: "Father's Name", type: 'string' }),
            defineField({ name: 'rollNumber', title: 'Roll Number', type: 'string' }),
            defineField({ name: 'grNumber', title: 'GR Number', type: 'string' }),
            defineField({ name: 'marks', title: 'Marks (per subject)', type: 'array', of: [{ type: 'number' }] }),
            defineField({ name: 'percentage', title: 'Percentage', type: 'number' }),
            defineField({ name: 'grade', title: 'Grade', type: 'string' }),
            defineField({ name: 'remarks', title: 'Remarks', type: 'string' }),
            defineField({ name: 'createdAt', title: 'Created At', type: 'datetime', initialValue: () => new Date().toISOString() }),
          ],
        }),
      ],
    }),
    defineField({ name: 'createdAt', title: 'Created At', type: 'datetime', initialValue: () => new Date().toISOString() }),
  ],
})
