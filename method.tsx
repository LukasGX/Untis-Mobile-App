import { WebUntis } from "webuntis";

export const realTimetable = async (
	untis: any,
	date: Date,
	useShortSubjectName: Boolean,
	debug: Boolean = false
): Promise<any> => {
	let debugLog = [];

	const timegridComplicated: any[] = await untis.getTimegrid();
	const timegrid = timegridComplicated?.[0]?.timeUnits || [];
	const timetable: any[] = await untis.getOwnTimetableFor(date);
	const teachers: any[] = await untis.getTeachers();

	debugLog.push({
		request: "getTimegrid()",
		response: timegrid,
		hideFromNetwork: false
	});
	debugLog.push({
		request: "getOwnTimetableFor(date)",
		response: timetable,
		hideFromNetwork: false
	});
	debugLog.push({
		request: "getTeachers()",
		response: teachers,
		hideFromNetwork: false
	});

	const real: any = { date: date.toISOString().split("T")[0] };

	timegrid.forEach((tu: any, i: number) => {
		const id = i === 6 ? "M" : String(i > 6 ? i : i + 1);
		const lessonsThisTU = timetable.filter(
			(lesson: any) =>
				lesson.startTime === tu.startTime &&
				lesson.endTime === tu.endTime
		);

		if (lessonsThisTU.length === 0) {
			real[id] = {
				startTime: tu.startTime,
				endTime: tu.endTime,
				lesson: null
			};
		} else {
			real[id] = lessonsThisTU.map((lesson: any) => ({
				startTime: lesson.startTime,
				endTime: lesson.endTime,
				lesson: {
					class: (lesson.kl || []).map((k: any) => k.longname),
					teacher: (lesson.te || []).map((t: any) => t.longname),
					subject: (lesson.su || []).map((s: any) =>
						useShortSubjectName ? s.name : s.longname
					),
					room: (lesson.ro || []).map((r: any) => r.name),
					code: lesson.code,
					teacherOld: (lesson.te || []).map((t: any) => {
						const teacherObj = teachers.find(
							(teacher: any) => teacher.id === t.orgid
						);
						return teacherObj ? teacherObj.longName : t.orgid;
					}),
					roomOld: (lesson.ro || []).map((r: any) => r.orgname),
					subjectOld: (lesson.su || []).map((s: any) => s.orgid)
				}
			}));
		}
	});

	debugLog.push({ realTimetable: real, hideFromNetwork: true });

	if (debug) return debugLog;
	return real;
};

export const classes = async (untis: any): Promise<any> => untis.getClasses();
export const teachers = async (untis: any): Promise<any> => untis.getTeachers();
export const rooms = async (untis: any): Promise<any> => untis.getRooms();
export const students = async (untis: any): Promise<any> => untis.getStudents();
export const schoolyear = async (untis: any): Promise<any> =>
	untis.getCurrentSchoolyear();
export const exams = async (untis: any, start: Date, end: Date): Promise<any> =>
	untis.getExamsForRange(start, end);

// Simple factory for Untis instance (avoid hardcoding credentials in source for production)
export const createUntis = (
	school: string,
	user: string,
	password: string,
	host: string
) => new WebUntis(school, user, password, host);

// Example usage in a React Native component (for reference only):
// const untis = useMemo(() => createUntis(SCHOOL, USER, PASS, HOST), []);
// useEffect(() => { (async () => { await untis.login(); const tt = await realTimetable(untis, new Date()); })(); }, []);
