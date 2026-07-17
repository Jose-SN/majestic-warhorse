/** Demo data for course-details reference UI — swap for API later. */

export interface CourseMaterialItem {
  id: string;
  name: string;
  type: 'psd' | 'zip' | 'pdf';
}

export interface ChapterMaterialsGroup {
  chapterId: string;
  chapterLabel: string;
  materials: (CourseMaterialItem & { attachment?: { fileURL: string; name: string } })[];
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
  materialsByChapter: [
    {
      chapterId: 'demo-chapter-1',
      chapterLabel: 'Chapter 1: Signal Analysis',
      materials: [
        { id: 'm1', name: 'Chapter 1 Sketch.psd', type: 'psd' },
        { id: 'm2', name: 'Reference Board.pdf', type: 'pdf' },
      ],
    },
    {
      chapterId: 'demo-chapter-2',
      chapterLabel: 'Chapter 2: Sculpting Pipeline',
      materials: [{ id: 'm3', name: '3D Model Files.obj/.blend', type: 'zip' }],
    },
  ] as ChapterMaterialsGroup[],
};
