-- =============================================================================
-- Seed data — initial portfolio content.
--
-- Every fact here comes from Rowshan Mannan Oni's CV. Anything unknown is left
-- NULL on purpose; fill it in from /oni_the_boss rather than inventing it.
--
-- Idempotent for settings/sections (upsert). Content tables are only seeded when
-- they are empty, so re-running never duplicates rows or overwrites edits.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Site settings
-- -----------------------------------------------------------------------------
insert into public.site_settings (
  id, full_name, professional_title, monogram,
  hero_headline, hero_description, hero_focus_areas,
  about_heading, about_short_bio, about_long_bio,
  availability, research_intro, research_interests, author_names,
  email, profile_image_alt, seo_title, seo_description, seo_keywords
) values (
  true,
  'Rowshan Mannan Oni',
  'Software Engineer & AI Researcher',
  'RO',
  'I build production software and study how machine learning can make software systems more capable and efficient.',
  'Software engineer with backend and full-stack industry experience, and researcher working on federated learning for software engineering, efficient models for edge devices, and AI-driven communication systems.',
  array['Software Engineering', 'Machine Learning Research', 'Applied AI Systems'],
  'Between building systems and studying them',
  'Software engineer and researcher trained at the Islamic University of Technology, with an Erasmus+ exchange at Mälardalen University in Sweden.',
  $md$I studied Software Engineering at the Islamic University of Technology (IUT) in Gazipur, Bangladesh, and spent the 2024–25 academic year at Mälardalen University in Västerås, Sweden, on an Erasmus+ funded exchange.

My engineering work includes backend development on HRythmic, the in-house HR management product at Dynamic Solution Innovators, and full-stack development of a Lab Management System for the Alstom TS&IT Lab in Sweden — built with an international student team and deployed in a real environment.

On the research side, my undergraduate thesis studied personalized federated learning for agile story-point estimation, and I am first author of a paper on multimodal semantic communication for 6G and beyond in the IEEE Open Journal of the Communications Society. I am interested in graduate research that connects machine learning with software engineering and with efficient, deployable AI systems.$md$,
  'Open to graduate research opportunities and software engineering roles.',
  'My research applies machine learning where data, compute or bandwidth are constrained: keeping software-project data local through federated learning, preparing models for edge hardware, and studying how AI reshapes communication systems.',
  array[
    'AI for Software Engineering',
    'Machine Learning',
    'Federated Learning',
    'Natural Language Processing',
    'Large Language Models',
    'Edge AI and Model Optimization',
    'Semantic Communication',
    'Quantum Communication'
  ],
  array['R. M. Oni', 'Rowshan Mannan Oni'],
  'rowshanmannanoni@gmail.com',
  'Portrait of Rowshan Mannan Oni',
  'Rowshan Mannan Oni — Software Engineer & AI Researcher',
  'Portfolio of Rowshan Mannan Oni, a software engineer and AI researcher working on federated learning, AI for software engineering, edge AI and semantic communication.',
  array['Rowshan Mannan Oni', 'Software Engineer', 'AI Researcher', 'Federated Learning', 'Machine Learning', 'Semantic Communication']
)
on conflict (id) do nothing;

-- -----------------------------------------------------------------------------
-- Sections
-- -----------------------------------------------------------------------------
insert into public.section_settings (key, visible, nav_label, heading, subheading, display_order) values
  ('about',        true, 'About',        'About',            null, 1),
  ('experience',   true, 'Experience',   'Experience',       'Industry work across backend and full-stack engineering.', 2),
  ('research',     true, 'Research',     'Research',         'Machine learning for software engineering and constrained systems.', 3),
  ('publications', true, 'Publications', 'Publications',     null, 4),
  ('projects',     true, 'Projects',     'Projects',         'Selected engineering and applied-AI work.', 5),
  ('skills',       true, null,           'Skills & Tools',   null, 6),
  ('education',    true, null,           'Education',        null, 7),
  ('awards',       true, null,           'Honors & Awards',  null, 8),
  ('blog',         true, 'Writing',      'Writing',          'Notes on engineering and research.', 9),
  ('contact',      true, 'Contact',      'Contact',          'For research collaboration, graduate opportunities or engineering roles.', 10)
on conflict (key) do nothing;

-- -----------------------------------------------------------------------------
-- Social / contact links
-- Google Scholar and ORCID are present but empty: they stay hidden until a
-- value is added in the dashboard.
-- -----------------------------------------------------------------------------
insert into public.social_links (platform, label, value, display_order, visible)
select * from (values
  ('email',          'Email',          'rowshanmannanoni@gmail.com',                    1, true),
  ('github',         'GitHub',         'https://github.com/rowshan-mannan-oni',         2, true),
  ('linkedin',       'LinkedIn',       'https://www.linkedin.com/in/rowshan-mannan-oni/', 3, true),
  ('google_scholar', 'Google Scholar', null,                                            4, true),
  ('orcid',          'ORCID',          null,                                            5, true),
  ('codeforces',     'Codeforces',     'https://codeforces.com/profile/HIGHSATURN',     6, true)
) as v(platform, label, value, display_order, visible)
where not exists (select 1 from public.social_links);

-- -----------------------------------------------------------------------------
-- Experience
-- -----------------------------------------------------------------------------
insert into public.experiences (
  organization, role, employment_type, location, start_date, end_date,
  currently_working, short_description, achievements, technologies, display_order
)
select * from (values
  (
    'Dynamic Solution Innovators (DSI)',
    'Software Engineer Intern — Backend',
    'Internship',
    'Dhaka, Bangladesh',
    '2025-10', '2026-02', false,
    'Backend development for HRythmic, the company''s in-house HR management product.',
    array[
      'Implemented backend features across the product''s services.',
      'Solved production-level problems in a live product.',
      'Refactored existing modules to improve code quality, maintainability and performance.'
    ],
    array[]::text[],
    1
  ),
  (
    'Alstom, TS&IT Lab',
    'Full-Stack Developer',
    null,
    'Västerås, Sweden',
    '2024-10', '2025-01', false,
    'Designed and developed a Lab Management System for the Alstom TS&IT Lab as part of an industry-linked academic project.',
    array[
      'Implemented both the frontend and backend of the web application.',
      'Gathered requirements with the TS&IT Lab and collaborated with an international student team.',
      'Deployed the system in a real-world environment.'
    ],
    array['React', 'Tailwind CSS', 'TypeScript', 'MongoDB'],
    2
  )
) as v(organization, role, employment_type, location, start_date, end_date,
       currently_working, short_description, achievements, technologies, display_order)
where not exists (select 1 from public.experiences);

-- -----------------------------------------------------------------------------
-- Education (school certificates are stored but hidden by default)
-- -----------------------------------------------------------------------------
insert into public.education (
  institution, degree, department, location, start_date, end_date, grade,
  description, display_order, visible
)
select * from (values
  ('Islamic University of Technology (IUT)', 'B.Sc. in Software Engineering', null,
    'Gazipur, Bangladesh', null, null, 'CGPA 3.96 / 4.00', null, 1, true),
  ('Mälardalen University (MDU)', 'Exchange Studies',
    'School of Innovation, Design and Engineering (IDT)', 'Västerås, Sweden',
    '2024-09', '2025-06', null, 'Erasmus+ funded academic exchange.', 2, true),
  ('Govt. Hazi Muhammed Mohsin College', 'Higher Secondary Certificate (HSC)', null,
    'Chittagong, Bangladesh', null, '2021', 'GPA 5.00 / 5.00', null, 3, false),
  ('Govt. Muslim High School', 'Secondary School Certificate (SSC)', null,
    'Chittagong, Bangladesh', null, '2019', 'GPA 5.00 / 5.00', null, 4, false)
) as v(institution, degree, department, location, start_date, end_date, grade,
       description, display_order, visible)
where not exists (select 1 from public.education);

-- -----------------------------------------------------------------------------
-- Publications
-- -----------------------------------------------------------------------------
insert into public.publications (
  id, title, slug, authors, venue, venue_type, publisher, year, volume, pages,
  quartile, doi, publisher_url, featured, display_order
)
select
  '6a1c2f0e-4b7d-4f2a-9c51-1f8e2b3c4d01'::uuid,
  'Multimodal Semantic Communication for 6G and Beyond: AI-Driven Architectures, Trends, and Challenges',
  'multimodal-semantic-communication-6g',
  array['R. M. Oni', 'F. Khan', 'K. H. Ador', 'K. M. Habibullah'],
  'IEEE Open Journal of the Communications Society',
  'journal', 'IEEE', 2026, '7', '7182–7223', 'Q1',
  '10.1109/OJCOMS.2026.3705905',
  'https://ieeexplore.ieee.org/document/11574021',
  true, 1
where not exists (select 1 from public.publications);

-- -----------------------------------------------------------------------------
-- Research
-- -----------------------------------------------------------------------------
insert into public.research (
  title, short_description, problem, approach, significance, research_type,
  institution, supervisor, keywords, methods, dataset, highlights, featured,
  display_order
)
select
  'Personalized Federated Learning for Story Point Estimation',
  'FedSP-PEFT is a federated framework for agile story-point estimation in which each software project is a client and raw issue data never leaves the project.',
  'Learning-based story-point estimation benefits from data across many projects, but issue trackers often hold proprietary information that teams cannot pool centrally.',
  'Software projects act as federated clients. A frozen CodeBERT encoder is combined with FFA-LoRA adapters, FedProx local training and an ordinal CORN head, with personalized project-specific prediction heads.',
  'Personalized heads match local-only training without sharing raw data, while parameter-efficient federation cuts estimated client upload volume by about 494× compared with full-model federation.',
  'Undergraduate thesis',
  'Islamic University of Technology (IUT)',
  'Shohel Ahmed, Assistant Professor, IUT',
  array['Federated Learning', 'Story Point Estimation', 'Parameter-Efficient Fine-Tuning', 'AI for Software Engineering'],
  array['CodeBERT', 'FFA-LoRA', 'FedProx', 'CORN ordinal regression', 'Wilcoxon signed-rank test'],
  'TAWOS — 18 projects, 31,948 issues',
  array[
    'Evaluated against local-only, centralized, median and TF-IDF + SVM baselines.',
    'Project-specific heads raised accuracy from 0.273 to 0.372 and reduced MAE from 1.511 to 1.288.',
    'Results were significant under Wilcoxon signed-rank tests.',
    'Reduced estimated client upload volume by about 494× (99.8%) relative to full-model federation.'
  ],
  true, 1
where not exists (select 1 from public.research);

-- -----------------------------------------------------------------------------
-- Projects
-- -----------------------------------------------------------------------------
insert into public.projects (
  title, slug, short_description, full_description, start_date, end_date,
  organization, technologies, github_url, live_url, video_url, featured,
  display_order
)
select * from (values
  (
    'Lab Management System',
    'lab-management-system',
    'A full-stack lab management system for the Alstom TS&IT Lab, built with a cross-country student team and deployed in a real environment.',
    $md$Built for the TS&IT Lab at Alstom in Västerås, Sweden, as part of an industry-linked academic project.

- Designed and implemented both the frontend and the backend of the web application.
- Gathered requirements directly with the lab and worked within an international student team.
- Deployed the system for real use by the lab.$md$,
    '2024-10', '2025-01',
    'Alstom TS&IT Lab',
    array['React', 'Tailwind CSS', 'TypeScript', 'MongoDB'],
    null,
    null,
    'https://drive.google.com/file/d/1oElMh2pHJAiEuUicsvz0M9-G8KrjeDig/view',
    true, 1
  ),
  (
    '6-DOF Robotic Arm Control Simulator',
    'robotic-arm-simulator',
    'A browser-based simulator for a six-degrees-of-freedom robotic arm, rendered from a URDF model with real-time control of each joint. Placed 2nd Runner-Up at Techathon Nationals.',
    $md$Developed for the Techathon Nationals hackathon, where the project placed **2nd Runner-Up**.

- Renders and animates the arm from a URDF model.
- Provides real-time control of each of the six joints in the browser.$md$,
    null, null,
    'Techathon Nationals',
    array['React', 'TypeScript', 'Three.js', 'react-three-fiber', 'drei', 'urdf-loader', 'Zustand', 'Tailwind CSS'],
    'https://github.com/KHALID9029/TechaThon_final',
    'https://techa-thon-final.vercel.app/',
    null,
    true, 2
  ),
  (
    'Lightweight Snow Removal Model for Edge AI',
    'lmqformer-edge-ai',
    'Prepared the LMQFormer snow-removal model for embedded deployment: converted to ONNX and profiled on Qualcomm AI Hub for Snapdragon chipsets.',
    $md$- Converted the LMQFormer model to ONNX for framework-agnostic inference.
- Prepared and profiled the model on Qualcomm AI Hub, targeting Snapdragon chipsets.
- Optimized for deployment on embedded systems such as drones, CCTV cameras and IoT devices.$md$,
    null, null,
    null,
    array['PyTorch', 'ONNX', 'Qualcomm AI Hub'],
    'https://github.com/HIGH5ATURN/LMQFormer',
    null,
    null,
    true, 3
  ),
  (
    'Custom Ray Tracer',
    'ray-tracer',
    'A ray tracing engine written from scratch in C++, rendering 3D scenes with shadows, reflections, refractions and material properties.',
    null,
    null, null,
    null,
    array['C++', 'Linear Algebra', 'STL'],
    'https://github.com/HIGH5ATURN/Ray-Tracer',
    null,
    null,
    false, 4
  )
) as v(title, slug, short_description, full_description, start_date, end_date,
       organization, technologies, github_url, live_url, video_url, featured,
       display_order)
where not exists (select 1 from public.projects);

-- -----------------------------------------------------------------------------
-- Skills
-- -----------------------------------------------------------------------------
insert into public.skill_categories (id, name, description, display_order)
select * from (values
  ('b1000000-0000-4000-8000-000000000001'::uuid, 'Languages',           null, 1),
  ('b1000000-0000-4000-8000-000000000002'::uuid, 'AI / ML',             null, 2),
  ('b1000000-0000-4000-8000-000000000003'::uuid, 'Frameworks & Web',    null, 3),
  ('b1000000-0000-4000-8000-000000000004'::uuid, 'Databases',           null, 4),
  ('b1000000-0000-4000-8000-000000000005'::uuid, 'Development Tools',   null, 5)
) as v(id, name, description, display_order)
where not exists (select 1 from public.skill_categories);

insert into public.skills (category_id, name, display_order)
select v.category_id::uuid, v.name, v.display_order
from (values
  ('b1000000-0000-4000-8000-000000000001', 'C', 1),
  ('b1000000-0000-4000-8000-000000000001', 'C++', 2),
  ('b1000000-0000-4000-8000-000000000001', 'Python', 3),
  ('b1000000-0000-4000-8000-000000000001', 'Java', 4),
  ('b1000000-0000-4000-8000-000000000001', 'C#', 5),
  ('b1000000-0000-4000-8000-000000000001', 'Kotlin', 6),
  ('b1000000-0000-4000-8000-000000000001', 'JavaScript', 7),
  ('b1000000-0000-4000-8000-000000000001', 'TypeScript', 8),
  ('b1000000-0000-4000-8000-000000000002', 'PyTorch', 1),
  ('b1000000-0000-4000-8000-000000000002', 'ONNX', 2),
  ('b1000000-0000-4000-8000-000000000002', 'Qualcomm AI Hub', 3),
  ('b1000000-0000-4000-8000-000000000003', 'React', 1),
  ('b1000000-0000-4000-8000-000000000003', 'Next.js', 2),
  ('b1000000-0000-4000-8000-000000000003', 'Express.js', 3),
  ('b1000000-0000-4000-8000-000000000003', '.NET', 4),
  ('b1000000-0000-4000-8000-000000000004', 'SQL / Oracle SQL', 1),
  ('b1000000-0000-4000-8000-000000000004', 'MongoDB', 2),
  ('b1000000-0000-4000-8000-000000000004', 'Neo4j', 3),
  ('b1000000-0000-4000-8000-000000000005', 'Git', 1),
  ('b1000000-0000-4000-8000-000000000005', 'GitHub', 2),
  ('b1000000-0000-4000-8000-000000000005', 'Docker', 3),
  ('b1000000-0000-4000-8000-000000000005', 'Android Studio', 4),
  ('b1000000-0000-4000-8000-000000000005', 'Jetpack Compose', 5)
) as v(category_id, name, display_order)
where exists (select 1 from public.skill_categories c where c.id = v.category_id::uuid)
  and not exists (select 1 from public.skills);

-- -----------------------------------------------------------------------------
-- Honors & awards (dates are left empty where the CV does not state them)
-- -----------------------------------------------------------------------------
insert into public.awards (title, issuer, award_date, description, url, featured, display_order)
select * from (values
  ('2nd Runner-Up', 'Techathon Nationals', null,
    'National-level hackathon; built a 6-DOF robotic arm control simulator.',
    'https://techa-thon-final.vercel.app/', true, 1),
  ('Erasmus+ Scholarship', 'Erasmus+', null,
    'Fully funded scholarship for an academic exchange at Mälardalen University, Sweden.',
    null, true, 2),
  ('Best Emerging Team — Capture The Flag', 'Intra ICT Fest 2023 (CodeRush 1.0)', '2023',
    'Team Mr. RoBot, recognized among university-level participants.',
    'https://cse.iutoic-dhaka.edu/news/coderush-1-0', false, 3),
  ('National Collegiate Programming Contest 2023', null, '2023',
    'Team IUT MUSKETEERS ranked 160th out of over 200 teams.',
    'https://bapsoj.org/contests/ncpc-onsite-2023-hosted-by-ju/standings', false, 4)
) as v(title, issuer, award_date, description, url, featured, display_order)
where not exists (select 1 from public.awards);
