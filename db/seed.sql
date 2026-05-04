-- AutoApply Pro - Seed Data

INSERT INTO users (email, name) VALUES
  ('serdar.saglam01@icloud.com', 'Serdar Saglam'),
  ('demo@autoapply.pro',         'Demo User');

INSERT INTO companies (name, website, notes) VALUES
  ('Acme Corp',     'https://acme.example.com',     'Reached out via LinkedIn recruiter'),
  ('Globex',        'https://globex.example.com',   'Remote-friendly, EU timezone'),
  ('Initech',       'https://initech.example.com',  'TPS report enthusiasts'),
  ('Stark Industries','https://stark.example.com',  'Hardware + AI'),
  ('Wayne Enterprises','https://wayne.example.com', 'Large enterprise, slow process');

INSERT INTO resumes (user_id, content, parsed_data) VALUES
  (1,
   'Serdar Saglam — Senior Frontend Engineer. 8 yrs React/TS. Led design systems at scale.',
   '{"skills":["React","TypeScript","Tailwind","Node"],"years":8,"title":"Senior Frontend Engineer"}'),
  (1,
   'Serdar Saglam — Full-Stack Engineer variant emphasizing Node/Postgres.',
   '{"skills":["Node","Postgres","React","TypeScript"],"years":8,"title":"Full-Stack Engineer"}'),
  (2,
   'Demo User — Junior Developer. 2 yrs JS, learning TypeScript.',
   '{"skills":["JavaScript","HTML","CSS"],"years":2,"title":"Junior Developer"}');

INSERT INTO jobs (title, company, description, url, source, location, salary) VALUES
  ('Senior Frontend Engineer', 'Acme Corp',
   'Build delightful UIs with React + TypeScript. Design system ownership.',
   'https://linkedin.com/jobs/view/acme-fe-001', 'linkedin', 'Berlin, DE (Hybrid)', '€85k–€110k'),
  ('Full-Stack Engineer', 'Globex',
   'Node + React. Greenfield product. Remote within EU.',
   'https://indeed.com/viewjob?jk=globex-fs-002', 'indeed', 'Remote (EU)', '€90k–€120k'),
  ('React Engineer', 'Initech',
   'Maintain and extend internal tools. Tailwind, React Query.',
   'https://stepstone.de/jobs/initech-react-003', 'stepstone', 'Munich, DE', '€70k–€90k'),
  ('Lead Frontend Architect', 'Stark Industries',
   'Architect frontend platform across multiple product lines.',
   'https://xing.com/jobs/stark-lead-004', 'xing', 'Zurich, CH', 'CHF 140k–170k'),
  ('TypeScript Backend Engineer', 'Wayne Enterprises',
   'Node + TypeScript microservices. Postgres + Kafka.',
   'https://linkedin.com/jobs/view/wayne-be-005', 'linkedin', 'London, UK (Hybrid)', '£80k–£110k');

INSERT INTO cover_letters (user_id, job_id, content) VALUES
  (1, 1, 'Dear Acme team, I am excited to apply for the Senior Frontend Engineer role...'),
  (1, 2, 'Hi Globex, my background in React + Node aligns well with your greenfield product...'),
  (1, 4, 'To the Stark hiring team — leading frontend architecture across product lines is exactly...');

INSERT INTO applications (user_id, job_id, resume_id, cover_letter_id, status, salary_requested, notes, applied_at) VALUES
  (1, 1, 1, 1, 'applied',    '€100k', 'Auto-applied via LinkedIn EasyApply',         datetime('now','-7 days')),
  (1, 2, 2, 2, 'screening',  '€110k', 'Recruiter call scheduled',                    datetime('now','-5 days')),
  (1, 3, 1, NULL, 'draft',   NULL,    'Need to tailor CV before submitting',         NULL),
  (1, 4, 1, 3, 'interview',  'CHF 160k','Tech interview round 2 next week',          datetime('now','-14 days')),
  (1, 5, 2, NULL, 'rejected',NULL,    'Auto-rejected; reason: location requirement', datetime('now','-21 days')),
  (2, 3, 3, NULL, 'draft',   NULL,    'Practice application',                        NULL);
