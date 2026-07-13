/** Demo data for course-details reference UI — swap for API later. */

export interface CourseDiscussionItem {
  id: string;
  author: string;
  avatarUrl?: string;
  chapterLabel: string;
  chapterTitle: string;
  comment: string;
  timeAgo: string;
}

export interface CourseMaterialItem {
  id: string;
  name: string;
  type: 'psd' | 'zip' | 'pdf';
}

export const COURSE_DETAILS_DEMO = {
  heroSubtitle: 'Course Details & Concept Art',
  instructorBio:
    'Expert instructor specializing in 3D concept art and digital sculpting. Passionate about teaching the full pipeline from sketch to final render.',
  descriptionFallback:
    'In this course, students will learn about the complete 3D sculpting process, starting from the initial concept sketch all the way to the topology, rendering, and final presented render. This horse sculpture serves as the foundation for the entire Majestic Warhorse project.',
  materials: [
    { id: 'm1', name: 'Chapter 1 Sketch.psd', type: 'psd' },
    { id: 'm2', name: '3D Model Files.obj/.blend', type: 'zip' },
    { id: 'm3', name: 'Reference Board.pdf', type: 'pdf' },
  ] as CourseMaterialItem[],
  discussions: [
    {
      id: 'd1',
      author: 'Alex Rivera',
      chapterLabel: 'Chapter 1',
      chapterTitle: 'The Conceptual Sketch',
      comment: 'The lighting breakdown in this chapter really helped me understand form and depth.',
      timeAgo: '2 minutes ago',
    },
    {
      id: 'd2',
      author: 'Jordan Lee',
      chapterLabel: 'Chapter 2',
      chapterTitle: 'Blocking & Silhouette',
      comment: 'Great tips on silhouette readability — my horse model reads much better now.',
      timeAgo: '18 minutes ago',
    },
    {
      id: 'd3',
      author: 'Sam Ortiz',
      chapterLabel: 'Chapter 3',
      chapterTitle: 'Detail Pass',
      comment: 'Would love a follow-up on texture painting workflows for the mane.',
      timeAgo: '1 hour ago',
    },
  ] as CourseDiscussionItem[],
};
