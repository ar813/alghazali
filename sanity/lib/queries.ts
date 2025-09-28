// lib/queries.ts
export const getAllStudentsQuery = `*[_type == "student"]{
  _id,
  fullName,
  fatherName,
  fatherCnic,
  dob,
  rollNumber,
  grNumber,
  gender,
  admissionFor,
  nationality,
  medicalCondition,
  cnicOrBform,
  email,
  phoneNumber,
  whatsappNumber,
  address,
  formerEducation,
  previousInstitute,
  lastExamPercentage,
  guardianName,
  guardianContact,
  guardianCnic,
  guardianRelation,
  "photoUrl": photo.asset->url
}`

export const getAllSchedulesQuery = `*[_type == "schedule"]{
  className,
  days[] {
    day,
    periods[] {
      subject,
      time
    }
  }
}`

export const getScheduleByClassQuery = (className: string) => `*[_type == "schedule" && className == "${className}"]{
  className,
  days[] {
    day,
    periods[] { subject, time }
  }
}[0]`

export const getStudentByIdentifiers = (cnicOrBform: string, grNumber: string) => `*[_type == "student" && cnicOrBform == "${cnicOrBform}" && grNumber == "${grNumber}"][0]{
  _id,
  fullName,
  fatherName,
  fatherCnic,
  dob,
  rollNumber,
  grNumber,
  gender,
  admissionFor,
  nationality,
  medicalCondition,
  cnicOrBform,
  email,
  phoneNumber,
  whatsappNumber,
  address,
  formerEducation,
  previousInstitute,
  lastExamPercentage,
  guardianName,
  guardianContact,
  guardianCnic,
  guardianRelation,
  "photoUrl": photo.asset->url
}`
