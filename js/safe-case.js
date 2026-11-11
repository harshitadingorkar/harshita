// A Safe Space, in Harshita's words from the Framer site, grouped so it reads warmly: the people first, then what we
// learned, then the three moments of care. Same blocks as the GitHub case, plus cols (side-by-side notes), quotes
// (voices side by side), people (who we designed with) and row (pictures side by side).
(window.CASES = window.CASES || {}).safe = {
  line: 'Giving trauma survivors back a sense of control before, during and after an intimate exam.',
  meta: [['Role', 'Product Designer'], ['Team', '3 Product Designers, 1 Product Manager'], ['Timeline', 'Sept to December 2023'], ['Methods', 'User Surveys & Interviews, Observation, Prototyping, User Testing']],
  note: 'Content note: the following contains topics of sexual assault.',
  sections: [
    { toc: 'Overview', h: 'Sensitizing Invasive Medical Exams', blocks: [
      { t: 'lede', x: 'How might we create a safe space for sexual assault survivors during preventative healthcare appointments?' },
      { t: 'p', x: 'A Safe Space aims to empower patients with a history of trauma and improve patient-provider communication by transforming the physical patient room with smart technology and optimizing the patient booking experience through a redesign of the MyChart booking system.' },
      { t: 'p', x: 'This initiative addresses a critical gap in trauma-informed healthcare, developed by a team of four from the University of Washington committed to creating meaningful change in patient experiences.' },
    ] },
    { toc: 'The challenge', lab: 'Problem space', h: 'The Challenge', blocks: [
      { t: 'p', x: 'Visits to the gynecologist’s office often feel cold and transactional. For survivors of sexual trauma, these environments can nurture painful memories when warmth and safety are needed most.' },
      { t: 'p', x: 'Routine invasive procedures like pelvic exams or pap smears can be retriggering or even retraumatizing. This project is an attempt to reshape a broken system into one that nurtures healing instead of trauma.' },
      { t: 'quote', x: 'I dread every visit, I feel completely helpless and retriggered. It’s terrifying.', by: 'Survivor, about a pelvic exam' },
      { t: 'img', src: 'cases/safe/16.jpg', alt: '75% of survivors felt unsafe during the exam; providers rated their confidence in trauma-informed care 3.6 of 5; patients rated it 2.5 of 5.' },
    ] },
    { toc: 'Listening', lab: 'Research', h: 'How we arrived at the solution', blocks: [
      { t: 'cols', items: [
        { title: 'Online Netnography', text: 'I scoured existing resources & communities via various reddit threads and forums like nurse.com to learn about survivors’ pelvic exam experiences and trauma-informed care through healthcare professionals and patients.' },
        { title: 'On-site Observation', text: 'We took a closer look at the patient room by booking an appointment and visiting the space to understand the atmosphere and how it could be made more comforting.' },
        { title: 'User Surveys & Interviews', text: 'We reached out far & wide to survivors, healthcare professionals, educators & organizations, then followed up with detailed interviews. I conducted 2 of the 6 interviews with survivors and healthcare providers.' },
      ] },
      { t: 'row', cover: true, imgs: [['cases/safe/04.jpg', 'Hand-drawn pictures on the exam room wall.'], ['cases/safe/05.jpg', 'The exam bed.'], ['cases/safe/06.jpg', 'Patients’ rights on the back of the door.']], cap: 'Hand-drawn drawings were helpful in making the environment feel warm & safe. Patients rights are displayed at the back of the door.' },
      { t: 'quotes', items: [
        ['One of the hallmarks of trauma experiences is loss of control.', 'Survivor'],
        ['She sat on a stool where she was not hovering over me, but below me, very reassuring.', 'Survivor, about a pelvic exam'],
        ['I was just not prepared to get a pap smear that day, was caught off guard and powerless.', 'Survivor, about a pelvic exam'],
        ['It is frustrating to defend my need for care, a basic right.', 'Survivor, about a pelvic exam'],
        ['I feel helpless when system-related factors hinder my ability to best care for my patients and myself.', 'Nurse'],
      ] },
    ] },
    { toc: 'Who we heard', lab: 'Key findings', h: 'User Groups', blocks: [
      { t: 'p', x: 'After thorough analysis of our research data through affinity mapping, we identified crucial patterns and themes. Our research revealed two primary user groups: Survivors/Victims and Healthcare Providers.' },
      { t: 'row', cover: true, imgs: [['cases/safe/17.jpg', 'The team affinity mapping on a whiteboard.'], ['cases/safe/03.jpg', 'Themes from the affinity map.']] },
      { t: 'people', items: [
        ['cases/safe/18.jpg', 'Advocate Survivors', 'Empowered individuals asserting their needs', 'It’s not my job to explain my survivorship.'],
        ['cases/safe/19.jpg', 'Hesitant Survivors', 'Those struggling with trust in medical settings', 'I have a really difficult time feeling comfortable with doctors.'],
        ['cases/safe/20.jpg', 'Seasoned Practitioners', 'Experienced practitioners with limited time', 'I don’t have enough time to talk through the exam process for each patient.'],
        ['cases/safe/21.jpg', 'Eager Residents', 'Eager residents aiming to provide comprehensive care', 'I really want to honor patients’ trust in me.'],
      ] },
      { t: 'p', quiet: true, x: 'The terms “survivor” and “victim” are used based on personal preference and can reflect an individual’s healing journey.' },
    ] },
    { toc: 'Areas of concern', lab: 'Key findings', h: 'Areas of concern', blocks: [
      { t: 'p', x: 'Our research revealed four critical issues affecting trauma survivors’ healthcare experiences:' },
      { t: 'cols', n: 2, items: [
        { title: 'Lack of Patient Education', text: 'Patients feel uninformed about appointments & need more control over their appointments and rights.' },
        { title: 'Unsupportive Exam Room Environments', text: 'Exam rooms must foster trust and comfort through improved physical space and doctor-patient interactions.' },
        { title: 'Insufficient Provider Time & Preparedness', text: 'Providers need more time, confidence, and training to deliver trauma-informed care.' },
        { title: 'Fragmented Care Across Providers', text: 'A holistic view of the patient across different providers and therapists is needed to avoid re-disclosure of trauma and dissociation.' },
      ] },
    ] },
    { toc: 'Ideation', lab: 'Design process', h: 'Thorough, iterative ideation', blocks: [
      { t: 'p', x: 'We brainstormed, mind-mapped and sketched our ideas on how we could address the pain points. Lots of sketches and mid-fidelity prototypes.' },
      { t: 'row', imgs: [['cases/safe/22.jpg', 'A sketch of a calmer exam room.'], ['cases/safe/30.jpg', 'Let patients know what they can ask for.'], ['cases/safe/25.jpg', 'An intake form that offers choice.'], ['cases/safe/27.jpg', 'Digital posters on a TV instead of paper ones.'], ['cases/safe/31.jpg', 'A waiting room that evokes safety.'], ['cases/safe/32.jpg', 'Medical history within each profile.']], cap: 'Some of our many ideas.' },
    ] },
    { toc: 'Testing', lab: 'User testing & iteration', h: 'Trial & Error', blocks: [
      { t: 'p', x: 'We conducted usability tests with 4 people & tasked them to navigate booking an appointment on our mid-fidelity prototypes. While some things went well, there was plenty of room for improvement.' },
      { t: 'img', src: 'cases/safe/34.jpg', cap: 'Selecting exams during appointment booking.' },
      { t: 'img', src: 'cases/safe/35.jpg', cap: 'Information about due examinations.' },
      { t: 'img', src: 'cases/safe/36.jpg', cap: 'Viewing patient rights.' },
    ] },
    { toc: 'The solution', lab: 'Final result', h: 'Three phased solution', blocks: [
      { t: 'p', x: 'After thorough research, my team and I pinpointed the three key phases of a patient’s journey and crafted a series of interconnected solutions for each phase, that function together as a unified, holistic approach.' },
      { t: 'cols', items: [
        { n: '01', title: 'Before Care', sub: 'Booking & checking into the appointment', items: ['Patients can view information & pre-select exams they’re due for, so they know what to expect from their appointment.', 'Patients can choose to disclose any history of trauma & request special accommodations.', 'Patient rights are displayed clearly before submitting the consent form, and walked through again at check-in, giving patients another chance to prepare while they wait.'] },
        { n: '02', title: 'In the moment of Care', sub: 'The physical appointment experience', items: ['Patients can control temperature, room lighting, choose calming ceiling projections and hospital approved aroma diffusers via tablets owned by the clinic.', 'Calm-colored walls, chairs positioned under a patient’s line of sight, and a comfort box stocked with stress balls, warming pads and lubricant heaters.'] },
        { n: '03', title: 'After Care', sub: 'Effective feedback mechanisms', items: ['A post-consultation review questionnaire, carefully designed to gather impressions of a patient’s visit to help practitioners provide the best care.', 'This empowers patients to reflect and shape their future care.'] },
      ] },
      { t: 'img', src: 'cases/safe/02.jpg', alt: 'The redesigned MyChart booking: choosing exams, sharing accommodations, and seeing your rights.' },
    ] },
    { toc: 'Looking back', lab: 'Reflection & learning', h: 'Looking back', blocks: [
      { t: 'cols', items: [
        { title: 'Empathy in Sensitive Contexts', text: 'Working on sensitive topics like trauma requires great care, empathy, and thoughtfulness in design. I’ve grown in my ability to consider the emotional impact of design choices and to create experiences that promote well-being.' },
        { title: 'Small Changes, Big Impact', text: 'Even seemingly small changes, like a few extra steps during the booking process, can have a significant impact on patient experiences and outcomes. There are always opportunities to make meaningful improvements in healthcare.' },
        { title: 'Getting Feedback, Making it Real', text: 'I want to seek feedback from a diverse range of survivors and providers, and engage with key decision-makers who can turn our speculative design into a reality within healthcare systems.' },
      ] },
      { t: 'img', src: 'cases/safe/37.jpg', cap: 'Team FourGood beaming after a successful presentation.' },
    ] },
  ],
};
