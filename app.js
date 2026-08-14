// ══════════════════════════════════════════════════════════════
// 오늘의 운세 - 메인 로직 (원본 파이썬 스크립트 JS 이식)
// ══════════════════════════════════════════════════════════════

function hasBatchim(word) {
    const last = word[word.length - 1];
    const code = last.charCodeAt(0);
    if (code >= 0xAC00 && code <= 0xD7A3) {
        return (code - 0xAC00) % 28 !== 0;
    }
    return false;
}

// 검증된 60갑자 기준일: 2000-01-01 = 무오(戊午)일, 지지 인덱스 6 = "오"
function getTodayBranch(date) {
    const baseDate = new Date(2000, 0, 1);
    const baseBranchIdx = 6;
    const diffDays = Math.floor((date.setHours(0,0,0,0) - baseDate.setHours(0,0,0,0)) / 86400000);
    const idx = ((baseBranchIdx + diffDays) % 12 + 12) % 12;
    return EARTHLY_BRANCHES[idx];
}

function getSpecialNote(myBranch, todayBranch) {
    const k1 = `${myBranch},${todayBranch}`;
    const k2 = `${todayBranch},${myBranch}`;
    if (SPECIAL_RELATIONS[k1]) return SPECIAL_RELATIONS[k1];
    if (SPECIAL_RELATIONS[k2]) return SPECIAL_RELATIONS[k2];
    return null;
}

function getGapjaForYear(year) {
    const stemIdx = (((6 + (year - 2000)) % 10) + 10) % 10;
    const branchIdx = (((4 + (year - 2000)) % 12) + 12) % 12;
    return [HEAVENLY_STEMS[stemIdx], EARTHLY_BRANCHES[branchIdx]];
}

function getBirthYearsForBranch(branch, minAge = 1, maxAge = 80) {
    const currentYear = new Date().getFullYear();
    const branchIdx = EARTHLY_BRANCHES.indexOf(branch);
    const years = [];
    for (let year = currentYear - maxAge - 1; year <= currentYear - minAge + 2; year++) {
        const yearBranchIdx = (((4 + (year - 2000)) % 12) + 12) % 12;
        if (yearBranchIdx === branchIdx) {
            const approxAge = currentYear - year;
            if (approxAge >= minAge && approxAge <= maxAge) years.push(year);
        }
    }
    years.sort((a, b) => a - b);
    return years;
}

function getRelation(branchA, branchB) {
    if (branchA === branchB) return "평이";
    const pair = `${branchA},${branchB}`;
    const rpair = `${branchB},${branchA}`;
    if (YUKHAP.has(pair) || YUKHAP.has(rpair)) return "육합";
    for (const group of SAMHAP_GROUPS) {
        if (group.has(branchA) && group.has(branchB) && branchA !== branchB) return "삼합";
    }
    return "평이";
}

function getElementDynamic(elemA, elemB) {
    if (elemA === elemB) return "동기";
    if (GENERATES[elemA] === elemB) return "일진이 생년을 도움(상생-피생)";
    if (GENERATES[elemB] === elemA) return "생년이 일진을 도움(상생-생함)";
    if (OVERCOMES[elemA] === elemB) return "다스림A";
    if (OVERCOMES[elemB] === elemA) return "다스림B";
    return "중립";
}

// 간단한 결정적 해시 (MD5 대체용 문자열 해시)
function hashString(str) {
    let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
    for (let i = 0; i < str.length; i++) {
        const ch = str.charCodeAt(i);
        h1 = Math.imul(h1 ^ ch, 2654435761);
        h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (4294967296 * (2097151 & h2) + (h1 >>> 0));
}

function getAdviceCategory(todayBranch, birthStem, birthBranch) {
    const relationType = getRelation(todayBranch, birthBranch);
    const elemDynamic = getElementDynamic(BRANCH_ELEMENT[todayBranch], STEM_ELEMENT[birthStem]);
    const key = `${relationType}|${elemDynamic}`;
    return RELATION_ADVICE[key] ? key : `${relationType}|중립`;
}

function generateFortuneLine(todayBranch, birthStem, birthBranch, slotIndex) {
    const pool = RELATION_ADVICE[getAdviceCategory(todayBranch, birthStem, birthBranch)];
    const advice = pool[slotIndex % pool.length];
    return `${advice}.`;
}

function formatDateKorean(date) {
    return `${date.getFullYear()}년 ${String(date.getMonth() + 1).padStart(2, '0')}월 ${String(date.getDate()).padStart(2, '0')}일`;
}

function buildAllEntries() {
    const allEntries = [];
    for (const myBranch of EARTHLY_BRANCHES) {
        for (const y of getBirthYearsForBranch(myBranch)) {
            allEntries.push([myBranch, y]);
        }
    }
    allEntries.sort((a, b) => a[1] - b[1]);
    return allEntries;
}

function generateDailyFortune(today = new Date()) {
    const todayBranch = getTodayBranch(new Date(today));
    const todayIdx = EARTHLY_BRANCHES.indexOf(todayBranch);

    const allEntries = buildAllEntries();
    const categorySlot = {};
    const categoryCounters = {};
    for (const [myBranch, y] of allEntries) {
        const [stem, branch] = getGapjaForYear(y);
        const cat = getAdviceCategory(todayBranch, stem, branch);
        const slot = categoryCounters[cat] || 0;
        categoryCounters[cat] = slot + 1;
        categorySlot[`${myBranch}|${y}`] = slot;
    }

    const results = [];
    for (let i = 0; i < EARTHLY_BRANCHES.length; i++) {
        const myBranch = EARTHLY_BRANCHES[i];
        const ttiName = TTI_NAMES[i];
        const starDistance = (((todayIdx - i) % 12) + 12) % 12;
        const starBranch = EARTHLY_BRANCHES[starDistance];
        const info = STARS_INFO[starBranch];
        const specialNote = getSpecialNote(myBranch, todayBranch);

        const birthYears = getBirthYearsForBranch(myBranch);
        const yearLines = birthYears.map(y => {
            const [stem, branch] = getGapjaForYear(y);
            const slot = categorySlot[`${myBranch}|${y}`];
            const line = generateFortuneLine(todayBranch, stem, branch, slot);
            const shortYear = String(y % 100).padStart(2, '0');
            return { shortYear, year: y, line };
        });

        results.push({
            branch: myBranch, ttiName, info, specialNote, yearLines
        });
    }

    return { todayBranch, todayStr: formatDateKorean(today), results };
}
