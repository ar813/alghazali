import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'fee',
  title: 'Fee Record',
  type: 'document',
  fields: [
    defineField({
      name: 'student',
      title: 'Student',
      type: 'reference',
      to: [{ type: 'student' }],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'session',
      title: 'Academic Session',
      type: 'string',
      initialValue: '2025-2026',
    }),
    defineField({
      name: 'className',
      title: 'Class',
      type: 'string',
      description: 'Cached from student at the time of entry (helps filtering/reporting)'
    }),
    defineField({
      name: 'month',
      title: 'Month',
      type: 'string',
      options: {
        list: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'year',
      title: 'Year',
      type: 'number',
      validation: (Rule) => Rule.required().min(2000).max(2100),
    }),
    defineField({
      name: 'amountPaid',
      title: 'Amount Paid',
      type: 'number',
      validation: (Rule) => Rule.min(0),
    }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: [
          { title: 'Paid', value: 'paid' },
          { title: 'Partial', value: 'partial' },
          { title: 'Unpaid', value: 'unpaid' },
        ]
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'feeType',
      title: 'Fee Type',
      type: 'string',
      options: {
        list: [
          { title: 'Monthly', value: 'monthly' },
          { title: 'Admission', value: 'admission' },
        ]
      },
      initialValue: 'monthly',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'paidDate',
      title: 'Paid Date',
      type: 'date',
      options: { dateFormat: 'YYYY-MM-DD' },
    }),
    defineField({
      name: 'receiptNumber',
      title: 'Receipt Number',
      type: 'string',
    }),
    defineField({
      name: 'bookNumber',
      title: 'Book Number',
      type: 'string',
    }),
    defineField({
      name: 'notes',
      title: 'Notes',
      type: 'text',
      rows: 3,
    }),
  ],
  preview: {
    select: {
      student: 'student.fullName',
      month: 'month',
      year: 'year',
      status: 'status',
    },
    prepare({ student, month, year, status }) {
      return {
        title: `${student || 'Student'} — ${month} ${year}`,
        subtitle: status,
      }
    }
  }
})
