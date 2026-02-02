export type SchedulePeriod = {
    subject: string;
    time: string;
};

export type ScheduleDay = {
    day: string;
    periods: SchedulePeriod[];
};

export type ScheduleDoc = {
    _id: string;
    className: string;
    days: ScheduleDay[];
};
