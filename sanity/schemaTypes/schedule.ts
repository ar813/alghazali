import { defineType, defineField, defineArrayMember } from 'sanity'

export default defineType({
  name: 'schedule',
  title: 'Class Schedule',
  type: 'document',
  fields: [
    defineField({
      name: 'className',
      title: 'Class Name',
      type: 'string',
      options: {
        list: [
          { title: 'Class 1', value: '1' },
          { title: 'Class 2', value: '2' },
          { title: 'Class 3', value: '3' },
          { title: 'Class 4', value: '4' },
          { title: 'Class 5', value: '5' },
          { title: 'Class 6', value: '6' },
          { title: 'Class 7', value: '7' },
          { title: 'Class 8', value: '8' },
          { title: 'SSCI', value: 'SSCI' },
          { title: 'SSCII', value: 'SSCII' },
        ],
      },
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'session',
      title: 'Academic Session',
      type: 'string',
      initialValue: '2025-2026',
    }),
    defineField({
      name: 'days',
      title: 'Days',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'daySchedule',
          fields: [
            defineField({
              name: 'day',
              title: 'Day',
              type: 'string',
              options: {
                list: [
                  { title: 'Saturday', value: 'Saturday' },
                  { title: 'Sunday', value: 'Sunday' },
                  { title: 'Monday', value: 'Monday' },
                  { title: 'Tuesday', value: 'Tuesday' },
                  { title: 'Wednesday', value: 'Wednesday' },
                  { title: 'Thursday', value: 'Thursday' },
                  { title: 'Friday', value: 'Friday' },
                ],
              },
              validation: Rule => Rule.required(),
            }),
            defineField({
              name: 'periods',
              title: 'Periods',
              type: 'array',
              of: [
                defineArrayMember({
                  type: 'object',
                  name: 'period',
                  fields: [
                    defineField({
                      name: 'subject',
                      title: 'Subject',
                      type: 'string',
                      options: {
                        list: [
                          { title: 'English', value: 'English' },
                          { title: 'Urdu', value: 'Urdu' },
                          { title: 'Math', value: 'Math' },
                          { title: 'Science', value: 'Science' },
                          { title: 'Islamiat', value: 'Islamiat' },
                          { title: 'Computer', value: 'Computer' },
                          { title: 'History', value: 'History' },
                          { title: 'Art', value: 'Art' },
                        ],
                      },
                      validation: Rule => Rule.required(),
                    }),
                    defineField({
                      name: 'time',
                      title: 'Time',
                      type: 'string',
                      options: {
                        list: [
                          '08:00 - 08:35',
                          '08:35 - 09:10',
                          '09:10 - 09:45',
                          '09:45 - 10:20',
                          '10:20 - 10:55',
                          '10:55 - 11:30',
                          '11:30 - 12:05',
                          '12:05 - 12:40',
                          '12:40 - 13:15',
                          '13:15 - 13:50',
                        ],
                      },
                      validation: Rule => Rule.required(),
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    }),
  ],
})
