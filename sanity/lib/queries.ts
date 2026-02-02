const studentFields = `
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
  issueDate,
  expiryDate,
  "photoUrl": photo.asset->url
`

// Session logic: Check session match OR if searching for default session (2024-2025), include docs with no session.
const sessionFilter = `($session == null || session == $session || (!defined(session) && $session == "2024-2025"))`

export const getAllStudentsQuery = `*[_type == "student" && ${sessionFilter}]{${studentFields}}`

export const getPaginatedStudentsQuery = `*[_type == "student" 
  && ${sessionFilter}
  && ($classFilter == "All" || admissionFor == $classFilter)
  && ($search == "" || fullName match $search + "*" || fatherName match $search + "*" || rollNumber match $search + "*" || grNumber match $search + "*")
] | order(admissionFor asc, rollNumber asc) [$start...$end] {${studentFields}}`

export const getStudentsCountQuery = `count(*[_type == "student" 
  && ${sessionFilter}
  && ($classFilter == "All" || admissionFor == $classFilter)
  && ($search == "" || fullName match $search + "*" || fatherName match $search + "*" || rollNumber match $search + "*" || grNumber match $search + "*")
])`

export const getStudentStatsQuery = `{
  "total": count(*[_type == "student" && ${sessionFilter} && ($classFilter == "All" || admissionFor == $classFilter) && ($search == "" || fullName match $search + "*" || fatherName match $search + "*" || rollNumber match $search + "*")]),
  "boys": count(*[_type == "student" && gender == "male" && ${sessionFilter} && ($classFilter == "All" || admissionFor == $classFilter) && ($search == "" || fullName match $search + "*" || fatherName match $search + "*" || rollNumber match $search + "*")]),
  "girls": count(*[_type == "student" && gender == "female" && ${sessionFilter} && ($classFilter == "All" || admissionFor == $classFilter) && ($search == "" || fullName match $search + "*" || fatherName match $search + "*" || rollNumber match $search + "*")]),
  "kg": count(*[_type == "student" && admissionFor == "KG" && ${sessionFilter} && ($classFilter == "All" || admissionFor == $classFilter) && ($search == "" || fullName match $search + "*" || fatherName match $search + "*" || rollNumber match $search + "*")])
}`

export const getAllClassesQuery = `*[_type == "student"]{admissionFor}` // Lightweight fetch for filter options

export const getScheduleByClassQuery = (className: string) => `*[_type == "schedule" && className == "${className}"]{
  className,
  days[] {
    day,
    periods[] { subject, time }
  }
}[0]`

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

export const getStudentByIdentifiers = (cnicOrBform: string, grNumber: string) => `*[_type == "student" && cnicOrBform == "${cnicOrBform}" && grNumber == "${grNumber}"][0]{${studentFields}}`

export const getStudentByCnicAndGr = `*[_type == "student" && (cnicOrBform == $identity || fatherCnic == $identity || guardianCnic == $identity) && grNumber == $grNumber][0]{${studentFields}}`
