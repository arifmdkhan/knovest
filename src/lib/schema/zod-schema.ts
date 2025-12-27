import z from "zod";
export const courseLevels = ["Beginner", "Intermediate", "Advanced"] as const;

export const CourseStatus = ["Draft", "Published", "Achieved"] as const;
export const courseCategories = [
  "Stock",
  "F&O",
  "Commodities",
  "Currencies",
  "Intraday",
  "Crypto",
] as const;

export const courseSchema = z.object({
  title: z
    .string()
    .min(3, { message: "Title must be at least 3 characters long" })
    .max(100, { message: "Title must not be more than 100 characters" }),
  description: z
    .string()
    .min(3, { message: "Description must be at least 3 characters long" }),
  fileKey: z.string().min(1, { message: "File key is required" }),
  price: z.coerce
    .number({ message: "Price must be a valid number" })
    .min(0, { message: "Price must be at least 0" }),
  offerPrice: z.coerce
    .number({ message: "Offer Price must be a valid number" })
    .min(0, { message: "Offer Price must be at least 0" })
    .optional(),
  duration: z.coerce
    .number({ message: "Duration must be a valid number" })
    .min(1, { message: "Duration must be at least 1" })
    .max(100, { message: "Duration must not exceed 100" }),
  level: z.enum(courseLevels, {
    message: "Level must be one of the valid course levels",
  }),
  category: z.enum(courseCategories, { message: "Category is required" }),
  smallDescription: z
    .string()
    .min(3, { message: "Small description must be at least 3 characters long" })
    .max(200, { message: "Small description must not exceed 200 characters" }),
  slug: z
    .string()
    .min(3, { message: "Slug must be at least 3 characters long" })
    .regex(/^[a-z0-9-]+$/, {
      message: "Slug must only contain lowercase alphanumeric characters and hyphens",
    }),
  id: z.string().uuid().optional(),
  status: z.enum(CourseStatus, {
    message: "Status must be one of the valid course statuses",
  }),
});

export const chapterSchema = z.object({
  name: z
    .string()
    .min(3, { message: "Name must be at least 3 characters long" }),
  courseId: z.string().uuid({ message: "Invalid course id" }),
});
export const lessonSchema = z.object({
  name: z
    .string()
    .min(3, { message: "Name must be at least 3 characters long" }),
  courseId: z.string().uuid({ message: "Invalid course id" }),
  chapterId: z.string().uuid({ message: "Invalid chapter id" }),
  description: z
    .string()
    .min(3, { message: "Description must be at least 3 characters long" })
    .optional(),
  thumbnailKey: z.string().optional(),
  videoKey: z.string().optional(),
  resources: z
    .array(
      z.object({
        name: z.string(),
        url: z.string(),
      })
    )
    .optional(),
});

export type CourseSchemaType = z.infer<typeof courseSchema>;
export type chapterSchemaType = z.infer<typeof chapterSchema>;
export type lessonSchemaType = z.infer<typeof lessonSchema>;

export const toggleSaveCourseSchema = z.object({
  courseId: z.string().min(1, "Course ID is required"),
});
export type ToggleSaveCourseSchemaType = z.infer<typeof toggleSaveCourseSchema>;

