// What each exercise is for, and what research actually shows. Anything without a
// study of its own says so. Muscle-activity (EMG) studies are not growth studies.
(function () {
  const SRC = {
    incline: ['Incline vs flat bench, 8-week trial', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC7449336'],
    angle: ['Bench angle and chest muscle activity', 'https://pubmed.ncbi.nlm.nih.gov/33049982/'],
    legcurl: ['Seated vs lying leg curl, 12 weeks', 'https://pubmed.ncbi.nlm.nih.gov/33009197/'],
    overhead: ['Overhead vs arms-down triceps extension', 'https://informahealthcare.com/doi/full/10.1080/17461391.2022.2100279'],
    calf: ['Standing vs seated calf raise, 12 weeks', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10753835'],
    legext: ['Leg extension vs leg press growth', 'https://www.fisiologiadelejercicio.com/wp-content/uploads/2026/02/hypertrophic_effects_of_single__versus_multi_joint.1002-1.pdf'],
    recline: ['Leg extension seat angle', 'https://pubmed.ncbi.nlm.nih.gov/39699974/'],
    squatpress: ['Squat vs leg press training', 'https://pubmed.ncbi.nlm.nih.gov/27735888/'],
    preacher: ['Preacher vs incline curl, 8 weeks', 'https://pubmed.ncbi.nlm.nih.gov/39809454/'],
    bayes: ['Bayesian vs preacher cable curl', 'https://pubmed.ncbi.nlm.nih.gov/40082069/'],
    back: ['Pulldown and row muscle activity', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC449729'],
    rowgrip: ['Narrow vs wide grip row', 'https://jhk.termedia.pl/High-Density-Surface-Electromyography-Excitation-of-Prime-Movers-in-the-Narrow-vs,209550,0,2.html'],
    delt: ['Shoulder exercises and the three deltoid parts', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC7706677'],
    revfly: ['Hand position on the reverse fly machine', 'https://pubmed.ncbi.nlm.nih.gov/23302754/'],
    dead: ['Deadlift variations, research review', 'https://pubmed.ncbi.nlm.nih.gov/32107499/'],
    glute: ['Glute activity by exercise, research review', 'https://pubmed.ncbi.nlm.nih.gov/32132843/'],
    abs: ['Abdominal exercise muscle activity', 'https://pubmed.ncbi.nlm.nih.gov/16649890/'],
    health: ['Strength training and health, 16-study review', 'https://pubmed.ncbi.nlm.nih.gov/35228201/'],
    sexstr: ['Female and male strength differences', 'https://napier-repository.worktribe.com/OutputFile/4166754']
  };
  const G = 'Growth study', E = 'Muscle-activity study', R = 'Research review', N = 'No direct study';
  const p = (kind, text, src) => ({ kind, text, src });
  const none = what => p(N, 'I found no study on ' + what + ' itself. The muscles listed come from anatomy: they are the ones that move these joints.');

  const incline = p(G, 'In an 8-week trial with untrained young men, pressing on an incline grew the upper chest more than flat pressing at one of the three sites measured.', 'incline');
  const angle = p(E, 'Upper-chest activity peaked at about a 30° bench. Steeper angles shift the work to the front of the shoulder.', 'angle');
  const flat = p(E, 'The middle and lower chest were more active on a flat bench than on an incline.', 'angle');
  const ohp = p(E, 'The shoulder press worked the front of the shoulder hardest of four exercises tested, and the side of the shoulder strongly.', 'delt');
  const lat = p(E, 'The lateral raise strongly worked the side of the shoulder, alongside the shoulder press.', 'delt');
  const rear = p(E, 'Of bench press, fly, shoulder press and lateral raise, the lateral raise worked the rear of the shoulder most. Reverse flys were not in that test.', 'delt');
  const revfly = p(E, 'In 19 trained men on a reverse fly machine, a neutral (palms facing) grip gave slightly more rear-shoulder activity than palms down.', 'revfly');
  const pull = p(E, 'Wide-grip pulldowns and seated rows worked the lats strongly relative to the biceps.', 'back');
  const row = p(E, 'The seated row produced the most mid-back (middle trapezius and rhomboid) activity of the exercises compared.', 'back');
  const rowgrip = p(E, 'A narrow grip row leaned more on the lats; a wide grip leaned more on the upper and middle back.', 'rowgrip');
  const oh = p(G, 'Training with the arm overhead grew the triceps more than with the arm by the side (about 20% vs 14%), especially the long head.', 'overhead');
  const incurl = p(G, 'In 63 young women over 8 weeks, incline curls grew more of the upper biceps and preacher curls more of the lower biceps.', 'preacher');
  const bayes = p(G, 'The Bayesian cable curl and the preacher cable curl produced similar muscle growth and strength.', 'bayes');
  const spec = p(G, 'Squats and leg presses both build strength, and each improves its own movement most.', 'squatpress');
  const rdl = p(R, 'In the Romanian deadlift the hamstrings were more active than the lower-back muscles.', 'dead');
  const split = p(R, 'Split squat variations produced very high glute activity.', 'glute');
  const seatcurl = p(G, 'Over 12 weeks, seated leg curls grew the hamstrings more than lying ones (about 14% vs 9%).', 'legcurl');
  const standcalf = p(G, 'Over 12 weeks, standing calf raises grew the large calf muscle far more than seated raises. The deeper soleus grew about the same.', 'calf');
  const legext = p(G, 'Leg extensions grew the front thigh muscle that crosses the hip (rectus femoris) far more than leg press: about 13% vs 1%.', 'legext');
  const recline = p(G, 'Leaning the seat back a bit further grew that rectus femoris muscle more.', 'recline');
  const abraise = p(E, 'Hanging knee raises and incline reverse crunches were among the highest for abdominal activity.', 'abs');

  const I = {};
  const put = (ids, use, ...points) => ids.split(' ').forEach(id => I[id] = { use, points });

  const upperChest = 'Builds the upper chest, with help from the front of the shoulders and triceps.';
  put('incPress', upperChest, incline, angle);
  put('incMachPress incSmith nIncDb', upperChest, p(G, incline.text + ' This was not tested on your exact setup.', 'incline'), angle);
  put('flatPress machPress smithFlat', 'Builds the whole chest, with the front of the shoulders and triceps.', flat);
  put('pushup', 'A bodyweight press for the chest and triceps.', none('the deficit push-up'));
  put('chestRow machRow saRow', 'Builds the lats and mid-back. These pulls also bend the elbow, so the biceps help.', p(E, row.text + ' It tested the seated cable row, a close relative.', 'back'), rowgrip);
  put('seatedRow', 'Builds the lats and mid-back.', row, pull);
  put('wideRow', 'Builds the upper back and rear shoulders.', rowgrip);
  put('pulldown saPulldown', 'Builds the lats, the broad muscles down the sides of your back, plus the biceps.', p(E, pull.text, 'back'));
  put('widePulldown', 'Builds the lats and upper back.', pull);
  put('pullup', 'A bodyweight vertical pull for the lats and biceps.', none('the neutral-grip pull-up'));
  put('lateral dbLateral machLateral', 'Builds the sides of the shoulders, which adds width.', lat);
  put('cableY', 'Works the side and rear shoulders.', none('the cable Y-raise'), p(E, 'Related: ' + lat.text, 'delt'));
  put('ohp machOhp smithOhp', 'Builds the front and sides of the shoulders, plus triceps.', ohp);
  put('arnold', 'A rotating shoulder press for the front and sides of the shoulders.', p(E, 'Related movement: ' + ohp.text, 'delt'));
  put('revPec', 'Builds the rear of the shoulders.', revfly);
  put('csRearFly cableRearFly', 'Builds the rear of the shoulders and upper back.', p(E, 'Related machine version: in 19 trained men, hand position changed how hard the rear shoulder worked.', 'revfly'), rear);
  put('facePull', 'Trains the rear shoulders, upper back and the small muscles that rotate the shoulder.', none('the cable face pull'));
  put('ohTri ohDbTri saOhTri', 'Builds the triceps, especially the long head along the back of the upper arm.', oh);
  put('pushdown rgPushdown', 'Builds the triceps.', p(G, 'Compared with an overhead position, arms-by-side extensions still grew the triceps, though less (about 14% vs 20%).', 'overhead'));
  put('incCurl', 'Builds the biceps with the arm stretched behind the body.', incurl);
  put('preacher', 'Builds the biceps and the muscle under it (brachialis).', incurl, p(G, bayes.text, 'bayes'));
  put('bayesian', 'Builds the biceps with the arm behind the body, on a cable.', bayes);
  put('hammer', 'Works the biceps, brachialis and forearm with palms facing in.', none('the hammer curl'));
  put('legPress', 'Builds the front thighs and glutes.', spec);
  put('lpLow', 'A leg press aimed at the front thighs.', spec, p(N, 'I found no study confirming that a low, narrow foot position shifts more work to the quads. Treat that as coaching advice.'));
  put('smithSquat', 'Builds the front thighs and glutes.', p(G, spec.text + ' The study used free-weight squats.', 'squatpress'));
  put('pendulum goblet', 'Builds the front thighs, with the glutes helping.', none('this squat variation'), p(G, 'Related movements: ' + spec.text, 'squatpress'));
  put('split ffeSplit', 'Trains one leg at a time for the glutes and front thighs.', split);
  put('rdl', 'A hip hinge that builds the hamstrings and glutes.', rdl);
  put('dbRdl smithRdl', 'A hip hinge that builds the hamstrings and glutes.', p(R, rdl.text + ' The review was not specific to your equipment.', 'dead'));
  put('hipExt', 'A hip hinge for the hamstrings, glutes and lower back.', none('the 45° back extension'));
  put('seatedLegCurl slSeatedCurl', 'Builds the hamstrings by bending the knee.', seatcurl);
  put('lyingCurl', 'Builds the hamstrings by bending the knee.', seatcurl);
  put('standCurl', 'Builds the hamstrings, one leg at a time.', none('the standing cable leg curl'));
  put('legExt slLegExt', 'Isolates the front of the thigh.', legext, recline);
  put('standCalf', 'Builds the calves, especially the large visible muscle.', standcalf);
  put('lpCalf slCalf', 'Builds the calves with a straight knee.', p(G, 'Related straight-knee movement: ' + standcalf.text, 'calf'));
  put('seatedCalf', 'Builds the deeper calf muscle (soleus) with a bent knee.', standcalf);
  put('cableCrunch', 'Loads the abs as they curl your trunk, so you can add weight over time.', none('growth from the cable crunch'));
  put('revCrunch hanging', 'Works the abs and hip flexors.', abraise);
  put('captain', 'Works the abs and hip flexors.', p(E, 'Related movements: ' + abraise.text, 'abs'));

  const health = p(R, 'Doing muscle-strengthening exercise is linked with a 10–17% lower risk of early death, heart disease, cancer and diabetes. This is a link seen in population studies, not proof of cause.', 'health');

  window.LMTInfo = { get: id => I[id] || { use: '', points: [none('this exercise')] }, health, sources: SRC, ids: () => Object.keys(I) };
})();
