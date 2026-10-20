import { z } from "zod";

const trimText = (min: number, max: number, label: string) =>
  z
    .string()
    .trim()
    .min(min, `${label}不能为空`)
    .max(max, `${label}不能超过 ${max} 个字符`);

const optionalText = (max: number, label: string) =>
  z
    .string()
    .trim()
    .max(max, `${label}不能超过 ${max} 个字符`)
    .default("");

const mediaUrlSchema = z
  .string()
  .trim()
  .max(800, "链接过长")
  .refine(
    (value) =>
      value === "" ||
      value.startsWith("/") ||
      /^https?:\/\//i.test(value),
    "请输入以 / 或 http(s):// 开头的合法链接",
  )
  .default("");

const socialUrlSchema = z
  .string()
  .trim()
  .min(1, "社交链接不能为空")
  .max(500, "社交链接过长")
  .refine(
    (value) => /^(https?:\/\/|mailto:)/i.test(value),
    "社交链接需以 http(s):// 或 mailto: 开头",
  );

const slugSchema = z
  .string()
  .trim()
  .max(80, "Slug 不能超过 80 个字符")
  .refine(
    (value) =>
      value === "" || /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value),
    "Slug 只能包含小写字母、数字和连字符",
  );

const tagsSchema = z
  .array(trimText(1, 24, "标签"))
  .max(8, "最多添加 8 个标签")
  .default([]);

export const loginSchema = z.object({
  username: trimText(1, 32, "用户名"),
  password: z.string().min(1, "请输入密码").max(128, "密码过长"),
});

export const setupSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "用户名至少 3 个字符")
    .max(32, "用户名不能超过 32 个字符")
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      "用户名只能包含字母、数字、下划线和连字符",
    ),
  password: z
    .string()
    .min(12, "密码至少需要 12 个字符")
    .max(128, "密码不能超过 128 个字符"),
});

export const accountSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "用户名至少 3 个字符")
    .max(32, "用户名不能超过 32 个字符")
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      "用户名只能包含字母、数字、下划线和连字符",
    ),
  currentPassword: z
    .string()
    .min(1, "请输入当前密码")
    .max(128, "密码过长"),
  newPassword: z
    .string()
    .max(128, "密码不能超过 128 个字符")
    .refine(
      (value) => value === "" || value.length >= 12,
      "新密码至少需要 12 个字符",
    )
    .optional()
    .default(""),
});

export const contactSchema = z.object({
  name: trimText(2, 60, "称呼"),
  email: z
    .string()
    .trim()
    .min(1, "请填写邮箱")
    .max(120, "邮箱过长")
    .email("请输入有效的邮箱地址"),
  subject: trimText(2, 120, "主题"),
  message: z
    .string()
    .trim()
    .min(10, "留言至少需要 10 个字符")
    .max(3000, "留言不能超过 3000 个字符"),
  website: z.string().max(200).optional().default(""),
});

const socialSchema = z.object({
  label: trimText(1, 30, "社交平台名称"),
  url: socialUrlSchema,
});

export const profileUpdateSchema = z.object({
  name: trimText(1, 40, "姓名"),
  latinName: optionalText(60, "英文名"),
  role: trimText(1, 80, "身份"),
  greeting: trimText(1, 30, "问候语"),
  tagline: optionalText(240, "简介"),
  bio: z.string().trim().min(1, "个人介绍不能为空").max(6000, "个人介绍不能超过 6000 个字符"),
  location: optionalText(80, "所在地"),
  email: z
    .string()
    .trim()
    .min(1, "请填写邮箱")
    .max(120, "邮箱过长")
    .email("请输入有效的邮箱地址"),
  avatarUrl: mediaUrlSchema,
  availability: optionalText(120, "档期说明"),
  resumeUrl: mediaUrlSchema,
  currentFocus: optionalText(120, "当前关注"),
  yearsExperience: z
    .number()
    .int("工作年限需为整数")
    .min(0, "工作年限不能为负数")
    .max(60, "工作年限不能超过 60")
    .default(0),
  socials: z.array(socialSchema).max(10, "最多添加 10 个社交链接").default([]),
});

export const settingsUpdateSchema = z.object({
  siteTitle: trimText(1, 80, "站点标题"),
  siteDescription: optionalText(200, "站点描述"),
  footerText: optionalText(120, "页脚文字"),
  accentColor: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, "强调色需为 6 位十六进制颜色"),
});

export const skillInputSchema = z.object({
  category: trimText(1, 40, "分类"),
  name: trimText(1, 40, "技能名称"),
  level: z
    .number()
    .int("熟练度需为整数")
    .min(0, "熟练度不能小于 0")
    .max(100, "熟练度不能大于 100")
    .default(75),
  description: optionalText(120, "技能说明"),
  sortOrder: z.number().int().min(0).max(9999).optional(),
});

export const projectInputSchema = z.object({
  slug: slugSchema.optional().default(""),
  title: trimText(1, 80, "项目名称"),
  summary: z
    .string()
    .trim()
    .min(1, "项目摘要不能为空")
    .max(300, "项目摘要不能超过 300 个字符"),
  description: optionalText(20000, "项目详情"),
  coverUrl: mediaUrlSchema,
  tech: z
    .array(trimText(1, 32, "技术标签"))
    .max(16, "最多添加 16 个技术标签")
    .default([]),
  demoUrl: mediaUrlSchema,
  repoUrl: mediaUrlSchema,
  year: optionalText(10, "年份"),
  featured: z.boolean().default(false),
  published: z.boolean().default(true),
  sortOrder: z.number().int().min(0).max(9999).default(0),
});

export const postInputSchema = z.object({
  slug: slugSchema.optional().default(""),
  title: trimText(1, 120, "文章标题"),
  excerpt: optionalText(300, "摘要"),
  content: z.string().trim().min(1, "文章内容不能为空").max(80000, "文章内容过长"),
  tags: tagsSchema,
  coverUrl: mediaUrlSchema,
  published: z.boolean().default(false),
  publishedAt: z
    .string()
    .trim()
    .max(40, "发布时间格式无效")
    .nullable()
    .optional(),
});

export const messageReadSchema = z.object({
  isRead: z.boolean(),
});

export const idSchema = z.coerce.number().int().positive();
