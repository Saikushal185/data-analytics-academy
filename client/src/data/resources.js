// Curated external resources — reputable free sites and YouTube channels.
// `type` is 'site' or 'youtube'. Keyed by track id, plus a `general` list.

export const generalResources = [
  { name: 'Alex The Analyst', url: 'https://www.youtube.com/@AlexTheAnalyst', type: 'youtube', note: 'Full data-analyst career roadmap & projects' },
  { name: 'Luke Barousse', url: 'https://www.youtube.com/@LukeBarousse', type: 'youtube', note: 'Data analytics tools, SQL/Python projects' },
  { name: 'Google Data Analytics Certificate', url: 'https://www.coursera.org/professional-certificates/google-data-analytics', type: 'site', note: 'Beginner-to-job foundational program' },
  { name: 'Kaggle', url: 'https://www.kaggle.com/learn', type: 'site', note: 'Free micro-courses + datasets to practice' },
]

export const resourcesByTrack = {
  sql: [
    { name: 'Mode SQL Tutorial', url: 'https://mode.com/sql-tutorial/', type: 'site', note: 'Basic → advanced with an in-browser editor' },
    { name: 'SQLBolt', url: 'https://sqlbolt.com/', type: 'site', note: 'Interactive lessons from scratch' },
    { name: 'DataLemur', url: 'https://datalemur.com/', type: 'site', note: 'SQL interview questions (Ace the Data SQL)' },
    { name: 'StrataScratch', url: 'https://www.stratascratch.com/', type: 'site', note: 'Real company SQL/Python interview problems' },
    { name: 'Use The Index, Luke', url: 'https://use-the-index-luke.com/', type: 'site', note: 'SQL indexing & performance, deeply' },
  ],
  stats: [
    { name: 'StatQuest with Josh Starmer', url: 'https://www.youtube.com/@statquest', type: 'youtube', note: 'Clear stats & ML explanations' },
    { name: 'Seeing Theory', url: 'https://seeing-theory.brown.edu/', type: 'site', note: 'Visual, interactive probability & statistics' },
    { name: 'Khan Academy — Statistics', url: 'https://www.khanacademy.org/math/statistics-probability', type: 'site', note: 'Solid free fundamentals' },
    { name: 'Evan Miller A/B Test Calculator', url: 'https://www.evanmiller.org/ab-testing/', type: 'site', note: 'Sample size & significance tools' },
  ],
  python: [
    { name: 'Corey Schafer — pandas', url: 'https://www.youtube.com/playlist?list=PL-osiE80TeTsWmV9i9c58mdDCSskIFdDS', type: 'youtube', note: 'Thorough pandas video series' },
    { name: 'Data School (Kevin Markham)', url: 'https://www.youtube.com/@dataschool', type: 'youtube', note: 'pandas Q&A and tips' },
    { name: 'pandas Official Docs', url: 'https://pandas.pydata.org/docs/user_guide/index.html', type: 'site', note: 'The user guide is excellent' },
    { name: 'Real Python', url: 'https://realpython.com/', type: 'site', note: 'High-quality Python tutorials' },
  ],
  modeling: [
    { name: 'Kimball Group', url: 'https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/kimball-techniques/', type: 'site', note: 'The dimensional-modeling techniques' },
    { name: 'dbt Docs — Modeling', url: 'https://docs.getdbt.com/docs/build/models', type: 'site', note: 'How modern marts are built' },
  ],
  business: [
    { name: 'Storytelling with Data', url: 'https://www.storytellingwithdata.com/', type: 'site', note: 'Cole Nussbaumer Knaflic — blog & book' },
    { name: 'storytelling with data (YouTube)', url: 'https://www.youtube.com/@storytellingwithdata', type: 'youtube', note: 'Communicating insights effectively' },
  ],
  excel: [
    { name: 'Guy in a Cube', url: 'https://www.youtube.com/@GuyInACube', type: 'youtube', note: 'Power BI & DAX, weekly' },
    { name: 'SQLBI', url: 'https://www.sqlbi.com/', type: 'site', note: 'The definitive DAX resource' },
    { name: 'ExcelIsFun', url: 'https://www.youtube.com/@excelisfun', type: 'youtube', note: 'Deep Excel formula mastery' },
  ],
  dataviz: [
    { name: 'FT Visual Vocabulary', url: 'https://github.com/Financial-Times/chart-doctor/tree/main/visual-vocabulary', type: 'site', note: 'Which chart for which job' },
    { name: 'FlowingData', url: 'https://flowingdata.com/', type: 'site', note: 'Visualization examples & critique' },
    { name: 'Storytelling with Data', url: 'https://www.storytellingwithdata.com/', type: 'site', note: 'Chart design principles' },
  ],
  giteng: [
    { name: 'Atlassian Git Tutorials', url: 'https://www.atlassian.com/git/tutorials', type: 'site', note: 'Clear, practical git guides' },
    { name: 'dbt Learn', url: 'https://learn.getdbt.com/', type: 'site', note: 'Free official dbt courses' },
    { name: 'freeCodeCamp — Git & GitHub', url: 'https://www.youtube.com/watch?v=RGOj5yH7evk', type: 'youtube', note: 'Full git crash course' },
  ],
}
