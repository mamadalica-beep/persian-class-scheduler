// --- 1. OFFLINE HOLIDAY DATA (Jalali Month/Day) ---
// These are the fixed national holidays in Iran (Solar calendar)
const fixedHolidays = [
    "01/01", "01/02", "01/03", "01/04", "01/12", "01/13", // Nowruz & Sizdah Bedar
    "03/14", "03/15", // Khomeini's Death & 15 Khordad
    "11/22", // Islamic Revolution
    "12/29"  // Oil Nationalization
];

// Variable (Lunar) holidays change every year. 
// Example: Here are the approximate lunar holidays for 1405 (2026-2027)
const lunarHolidays1405 = [
    "01/09", "01/10", "01/21", "02/14", "03/05", "04/04", "05/03",
    "06/11", "06/19", "06/21", "07/16", "08/19", "09/14", "10/01", "11/27"
];

// --- 2. HOLIDAY CHECKER ---
function checkIsHoliday(jy, jm, jd, dayOfWeek) {
    // Format numbers to always be two digits (e.g., "01/02")
    let monthStr = jm < 10 ? '0' + jm : jm;
    let dayStr = jd < 10 ? '0' + jd : jd;
    let dateString = `${monthStr}/${dayStr}`;

    // JavaScript dayOfWeek: 5 is Friday
    if (dayOfWeek === 5) return { isOff: true, reason: "جمعه (Friday)" };

    // Check fixed solar holidays
    if (fixedHolidays.includes(dateString)) {
        return { isOff: true, reason: "تعطیل رسمی (National Holiday)" };
    }

    // Check lunar holidays for 1405
    if (jy === 1405 && lunarHolidays1405.includes(dateString)) {
        return { isOff: true, reason: "تعطیل مذهبی (Religious Holiday)" };
    }

    return { isOff: false, reason: "Working Day" };
}

// --- 3. TERM GENERATOR ENGINE ---
function generateTermSchedule(termStartStr, termEndStr, firstShiftDateStr) {
    // Convert text dates from the UI into real JavaScript Dates
    let termStart = new Date(termStartStr);
    let termEnd = new Date(termEndStr);
    let firstShiftDate = new Date(firstShiftDateStr);
    
    let schedule = [];
    let boysDaysCount = 0;
    let girlsDaysCount = 0;

    let currentDate = new Date(termStart);
    
    // Loop through every day of the term
    while (currentDate <= termEnd) {
        
        // 1. Convert current date to Jalali using the jalaali-js library
        let jDate = jalaali.toJalaali(currentDate.getFullYear(), currentDate.getMonth() + 1, currentDate.getDate());
        let dayOfWeek = currentDate.getDay(); // 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
        
        // 2. Check for Holidays & Fridays
        let holidayStatus = checkIsHoliday(jDate.jy, jDate.jm, jDate.jd, dayOfWeek);
        
        // 3. Calculate 24/48 Shift (3-day cycle)
        // Find how many days have passed since the first shift date
        let timeDiff = currentDate.getTime() - firstShiftDate.getTime();
        let daysDiff = Math.floor(timeDiff / (1000 * 3600 * 24));
        
        let isShiftDay = false;
        let isPostShiftDay = false;

        if (daysDiff >= 0) {
            let cycleDay = daysDiff % 3;
            if (cycleDay === 0) isShiftDay = true; // Day 1: Working 8AM to 8AM
            if (cycleDay === 1) isPostShiftDay = true; // Day 2: Got off work at 8AM
        }

        // 4. Determine Zoj (Even) / Fard (Odd)
        let isZoj = (dayOfWeek === 6 || dayOfWeek === 1 || dayOfWeek === 3); // Sat, Mon, Wed (Girls)
        let isFard = (dayOfWeek === 0 || dayOfWeek === 2 || dayOfWeek === 4); // Sun, Tue, Thu (Boys)

        // 5. Assign Final Status and Color
        let status = "Available";
        let color = "white";

        if (holidayStatus.isOff) {
            status = holidayStatus.reason;
            color = "#d1d5db"; // Gray
        } else if (isShiftDay) {
            status = "شیفت کاری (Work Shift 24h)";
            color = "#fca5a5"; // Red
        } else {
            if (isZoj) {
                status = "کلاس دختران (Girls / Zoj)";
                color = "#fbcfe8"; // Pink
                girlsDaysCount++;
            } else if (isFard) {
                status = "کلاس پسران (Boys / Fard)";
                color = "#bfdbfe"; // Blue
                boysDaysCount++;
                
                // Thursday Morning Conflict Check
                if (dayOfWeek === 4 && isPostShiftDay) {
                    status += " - ⚠️ احتیاط: کلاس صبح بعد از شیفت (Warning: Post-Shift Morning)";
                    color = "#fef08a"; // Yellow Warning
                }
            }
        }

        // Save the day's data
        schedule.push({
            gregorianDate: new Date(currentDate),
            jalaaliString: `${jDate.jy}/${jDate.jm}/${jDate.jd}`,
            dayOfWeek: dayOfWeek,
            status: status,
            color: color
        });

        // Move to the next day
        currentDate.setDate(currentDate.getDate() + 1);
    }

    return {
        schedule: schedule,
        summary: `روزهای پسران: ${boysDaysCount} | روزهای دختران: ${girlsDaysCount}`
    };
}