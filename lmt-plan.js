// Lean Muscle: goals, personal targets and the mobility routine. Every number links to its source.
(function () {
  const SRC = {
    acsm: ['ACSM resistance training position stand, 2026', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC12965823/'],
    volume: ['Weekly sets and muscle growth, meta-regression', 'https://sportrxiv.org/index.php/server/preprint/view/460'],
    protein: ['Protein and muscle gain, 49-study meta-analysis', 'https://pubmed.ncbi.nlm.nih.gov/28698222/'],
    deficitProtein: ['Protein while dieting, updated meta-regression', 'https://journals.lww.com/nsca-scj/fulltext/9900/effect_of_dietary_protein_on_fat_free_mass_in.179.aspx'],
    rate: ['Slow vs fast weight loss in athletes', 'https://pubmed.ncbi.nlm.nih.gov/21558571/'],
    surplus: ['Eating to build muscle, research review', 'https://pubmed.ncbi.nlm.nih.gov/31247944/'],
    bmr: ['Which calorie equation is most accurate', 'https://pubmed.ncbi.nlm.nih.gov/15883556/'],
    who: ['WHO physical activity guidelines, 2020', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC7719906/'],
    steps: ['Daily steps and lifespan, 15 cohorts', 'https://pubmed.ncbi.nlm.nih.gov/35247352/'],
    keepMuscle: ['Lifting while dieting keeps muscle, meta-analysis', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC12406911/'],
    cardio: ['Cardio alongside lifting, meta-analysis', 'https://pubmed.ncbi.nlm.nih.gov/34757594/'],
    rom: ['Strength training vs stretching for flexibility', 'https://pubmed.ncbi.nlm.nih.gov/33917036/'],
    stretch: ['ACSM exercise guidance, including stretching', 'https://pubmed.ncbi.nlm.nih.gov/21694556/']
  };

  const GOALS = [
    { id: 'muscle', name: 'Build muscle', icon: 'barbell', days: 4, line: 'Add size and strength with a small calorie surplus.',
      why: [['Train each muscle twice a week with about 10 or more hard sets. More sets add growth, with smaller gains as you go higher.', 'volume'], ['Aim to gain about 0.25–0.5% of your body weight a week. That keeps most of the gain as muscle rather than fat.', 'surplus'], ['Gains from extra protein level off at about 1.6 g per kg of body weight a day.', 'protein']] },
    { id: 'shred', name: 'Get shredded', icon: 'fire', days: 4, line: 'Lose fat while keeping the muscle you have.',
      why: [['Keep lifting with the same sets and effort. This is what tells your body to hold on to muscle while you eat less.', 'keepMuscle'], ['Lose about 0.5–0.7% of your body weight a week. Athletes losing 0.7% a week kept more muscle and strength than those losing 1.4%.', 'rate'], ['Eat more protein while dieting: about 2 g per kg. More protein meant more muscle kept.', 'deficitProtein']] },
    { id: 'fat', name: 'Lose fat', icon: 'trend-down', days: 3, line: 'Steady fat loss with lifting and more daily movement.',
      why: [['Lifting while eating less protects muscle, so more of the weight you lose is fat.', 'keepMuscle'], ['Add 150–300 minutes of moderate cardio a week. It doesn’t get in the way of strength or muscle gains.', 'cardio'], ['Steps matter: risk of early death kept falling up to 8,000–10,000 steps a day in adults under 60.', 'steps']] },
    { id: 'active', name: 'Move better', icon: 'person-simple-tai-chi', days: 3, line: 'Get fitter and more flexible, with strength to match.',
      why: [['Lifting through a full range of motion improved flexibility as much as stretching did.', 'rom'], ['Stretch at least 2–3 days a week, holding each stretch 10–30 s for about 60 s in total. Daily is best.', 'stretch'], ['Aim for 150–300 minutes of moderate activity a week.', 'who']] },
    { id: 'health', name: 'Stay healthy', icon: 'heartbeat', days: 2, line: 'The proven minimum for a strong, healthy body.',
      why: [['Train every major muscle at least twice a week. Going from no lifting to any lifting is the biggest win.', 'acsm'], ['Add 150–300 minutes of moderate activity, or 75–150 minutes of vigorous activity, each week.', 'who'], ['Under 60, risk of early death kept falling up to about 8,000–10,000 steps a day.', 'steps']] }
  ];

  const ACTIVITY = [
    ['low', 'Mostly sitting', 'Desk job, little walking', 1.2],
    ['light', 'Lightly active', 'Some walking, or training 1–3 days', 1.375],
    ['moderate', 'Active', 'On your feet a lot, or training 3–5 days', 1.55],
    ['high', 'Very active', 'Physical job plus training most days', 1.725]
  ];
  const EXPERIENCE = [
    ['new', 'New to lifting', 'Under 6 months'],
    ['some', 'Some experience', '6 months to 2 years'],
    ['exp', 'Experienced', 'More than 2 years']
  ];

  const MOBILITY = [
    ['Hip flexor lunge stretch', 'Kneel on one knee, tuck your hips under and shift forward until the front of the back hip stretches.', 30, true],
    ['Hamstring stretch', 'Heel on a low step, leg straight, hinge forward from the hips with a flat back.', 30, true],
    ['Deep squat hold', 'Sit into a deep squat, heels down, elbows pushing your knees out. Hold a post if you need to.', 45, false],
    ['Open book', 'Lie on your side, knees bent. Sweep the top arm over to the other side and let your chest open.', 30, true],
    ['Doorway chest stretch', 'Forearm on a door frame at shoulder height, step through until your chest stretches.', 30, true],
    ['Calf wall stretch', 'Hands on a wall, back leg straight, heel down. Lean in until the calf stretches.', 30, true],
    ['Child’s pose reach', 'Kneel, sit back on your heels and walk your hands forward to stretch your lats and back.', 45, false]
  ];

  const yearNow = () => new Date().getFullYear();
  // A sensible weight for protein maths when body fat is high: the weight at a BMI of 25.
  function targets(p, weight, sex) {
    p = p || {};
    const h = +p.height, w = +weight, age = p.birthYear ? yearNow() - p.birthYear : null, goal = GOALS.find(g => g.id === p.goal) || GOALS[0];
    const ready = h > 120 && w > 30 && age && sex;
    if (!ready) return { ready: false, goal };
    const out = { ready: true, goal, age, refs: [] };
    const bmi = w / Math.pow(h / 100, 2), refW = bmi > 30 ? 25 * Math.pow(h / 100, 2) : w;
    out.stepsLo = age >= 60 ? 6000 : 8000; out.stepsHi = age >= 60 ? 8000 : 10000;
    out.cardio = goal.id === 'muscle' || goal.id === 'shred' ? '150 min' : '150–300 min';
    out.protein = Math.round(refW * (goal.id === 'shred' ? 2 : 1.6) / 5) * 5;
    if (age < 18) { out.adultOnly = true; return out; }
    const bmr = 10 * w + 6.25 * h - 5 * age + (sex === 'female' ? -161 : 5);
    const act = (ACTIVITY.find(a => a[0] === p.activity) || ACTIVITY[1])[3], tdee = bmr * act;
    let kcal = tdee, rate = 0, note = '';
    if (goal.id === 'muscle') { const k = p.exp === 'exp' ? .05 : .1; kcal = tdee * (1 + k); rate = w * (p.exp === 'exp' ? .0025 : .004); }
    if (goal.id === 'shred' || goal.id === 'fat') {
      if (bmi < 18.5) { note = 'Your weight is already under the healthy range for your height, so this plan keeps calories at maintenance. Talk to a GP or dietitian before trying to lose weight.'; }
      else {
        const pct = goal.id === 'shred' ? .006 : .0075, deficit = Math.min(w * pct * 7700 / 7, tdee * .25);
        kcal = Math.max(tdee - deficit, bmr, sex === 'female' ? 1200 : 1500); rate = -(tdee - kcal) * 7 / 7700;
      }
    }
    Object.assign(out, { bmr: Math.round(bmr), maintain: Math.round(tdee / 10) * 10, kcal: Math.round(kcal / 10) * 10, rate: Math.round(rate * 100) / 100, note });
    return out;
  }

  window.LMTPlan = { SRC, GOALS, ACTIVITY, EXPERIENCE, MOBILITY, targets, yearNow };
})();
