import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'student',
  title: 'Student',
  type: 'document',
  fields: [
    // 👤 Personal Information
    defineField({
      name: 'fullName',
      title: 'Full Name',
      type: 'string',
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'fatherName',
      title: "Father's Name",
      type: 'string',
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'fatherCnic',
      title: "Father's CNIC Number",
      type: 'string',
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'dob',
      title: 'Date of Birth',
      type: 'date',
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'rollNumber',
      title: 'Roll Number',
      type: 'string',
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'grNumber',
      title: 'GR Number',
      type: 'string',
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'gender',
      title: 'Gender',
      type: 'string',
      options: {
        list: [
          { title: 'Male', value: 'male' },
          { title: 'Female', value: 'female' },
        ],
        layout: 'radio'
      },
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'admissionFor',
      title: 'Admission For',
      type: 'string',
      options: {
        list: [
          'KG', '1', '2', '3', '4', '5', '6', '7', '8', 'SSCI', 'SSCII'
        ],
      },
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'nationality',
      title: 'Nationality',
      type: 'string',
      options: {
        list: [
          { title: 'Pakistani', value: 'pakistani' },
        ],
        layout: 'radio'
      },
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'medicalCondition',
      title: 'Any Medical Condition',
      type: 'string',
      options: {
        list: [
          { title: 'Yes', value: 'yes' },
          { title: 'No', value: 'no' }
        ],
        layout: 'radio'
      },
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'cnicOrBform',
      title: "Student's CNIC / B-Form Number",
      type: 'string',
    }),

    // 📱 Contact Information
    defineField({
      name: 'email',
      title: 'Email Address',
      type: 'string',
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'phoneNumber',
      title: 'Phone Number',
      type: 'string',
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'whatsappNumber',
      title: 'WhatsApp Number',
      type: 'string',
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'address',
      title: 'Address',
      type: 'text',
      validation: Rule => Rule.required()
    }),

    // 📚 Academic Information
    defineField({
      name: 'formerEducation',
      title: 'Former Education',
      type: 'string',
      options: {
        list: [
          'KG', '1', '2', '3', '4', '5', '6', '7', '8', 'SSCI', 'SSCII'
        ],
      }
    }),
    defineField({
      name: 'previousInstitute',
      title: 'Previous Institute Name',
      type: 'string'
    }),
    defineField({
      name: 'lastExamPercentage',
      title: "Last Exam's Percentage",
      type: 'string'
    }),

    // 👨‍👩‍👧 Guardian Details
    defineField({
      name: 'guardianName',
      title: "Guardian's Name",
      type: 'string'
    }),
    defineField({
      name: 'guardianContact',
      title: "Guardian's Contact",
      type: 'string'
    }),
    defineField({
      name: 'guardianCnic',
      title: "Guardian's CNIC Number",
      type: 'string'
    }),
    defineField({
      name: 'guardianRelation',
      title: 'Relation',
      type: 'string',
      options: {
        list: [
          { title: 'Son', value: 'son' },
          { title: 'Daughter', value: 'daughter' },
          { title: 'Brother', value: 'brother' },
          { title: 'Sister', value: 'sister' },
          { title: 'Other', value: 'other' }
        ],
        layout: 'radio'
      }
    }),

    // 📷 Student Photo
    defineField({
      name: 'photo',
      title: 'Upload Student Photo',
      type: 'image',
      options: {
        hotspot: true
      }
    }),
  ],
})
