import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import bcrypt from "bcryptjs";
import path from "path";

const dbPath = path.join(process.cwd(), "dev.db");

const adapter = new PrismaBetterSqlite3({
  url: `file:${dbPath}`,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  // Seed Admin user
  const adminEmail = process.env.ADMIN_EMAIL || "dr.cbj@manorgrouphealth.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "ChangeMe123!";

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    await prisma.user.create({
      data: {
        name: "Dr. Coretta Brown-Johnson, JP",
        email: adminEmail,
        passwordHash,
        role: "ADMIN",
        profile: {
          create: {
            fullName: "Dr. Coretta Brown-Johnson, JP",
            phone: "(876) 370-0095",
          },
        },
      },
    });
    console.log("Admin user created.");
  } else {
    console.log("Admin user already exists.");
  }

  // Seed FAQs
  const faqCount = await prisma.faqItem.count();
  if (faqCount === 0) {
    await prisma.faqItem.createMany({
      data: [
        {
          question: "What services does Dr. CBJ offer?",
          answer:
            "Dr. Coretta Brown-Johnson, JP offers a wide range of psychological and behavioural services including clinical psychological assessment, behavioural assessment and intervention, child and adolescent services, neurodiversity and SEN support, educational psychological assessment, therapy and counselling, parenting and family support, training and professional development, consultation services, and mental health and wellness programmes.",
          order: 1,
        },
        {
          question: "How do I book an appointment?",
          answer:
            "You can book an appointment through our Book Appointment page. Simply fill in your details, choose your preferred date and time, select your session type, and submit. Our team will review your request and confirm your appointment.",
          order: 2,
        },
        {
          question: "Do you offer virtual sessions?",
          answer:
            "Yes! Dr. CBJ offers both in-person consultations at Manor Group Health+ and virtual sessions for clients who prefer remote support or are located outside of Kingston, Jamaica.",
          order: 3,
        },
        {
          question: "What is the AI chat assistant?",
          answer:
            "The AI chat assistant is a supportive tool for general mental wellness discussions. It provides warm, empathetic responses and general wellness support. It does not diagnose or prescribe, and always encourages professional consultation when appropriate.",
          order: 4,
        },
        {
          question: "Where is the office located?",
          answer:
            "Dr. CBJ practices at Manor Group Health+, Unit 7 Lower Manor Park Plaza, Kingston, Jamaica. You can reach us by phone at (876) 370-0095.",
          order: 5,
        },
        {
          question: "Do you work with children and adolescents?",
          answer:
            "Yes. Dr. CBJ provides child and adolescent psychological assessment, developmental and behavioural assessment, emotional regulation support, parent and caregiver consultation, and behaviour intervention planning.",
          order: 6,
        },
        {
          question: "What should I expect during my first session?",
          answer:
            "Your first session typically involves an initial assessment where we discuss your concerns, goals, and history. This helps us develop a personalised plan tailored to your needs.",
          order: 7,
        },
        {
          question: "Is my information kept confidential?",
          answer:
            "Absolutely. Confidentiality is a core value of our practice. All client information is handled with the highest standards of privacy and professionalism, in accordance with ethical guidelines.",
          order: 8,
        },
      ],
    });
    console.log("FAQs seeded.");
  }

  // Seed Testimonials
  const testimonialCount = await prisma.testimonial.count();
  if (testimonialCount === 0) {
    await prisma.testimonial.createMany({
      data: [
        {
          clientName: "S. Williams",
          displayName: "S. W.",
          content:
            "Dr. CBJ has been a guiding light for our family. Her compassionate approach and professional expertise helped our son thrive. We are forever grateful.",
          rating: 5,
          isApproved: true,
        },
        {
          clientName: "M. Thompson",
          displayName: "M. T.",
          content:
            "The therapy sessions with Dr. CBJ transformed my life. She created a safe, supportive space where I could heal and grow. Highly recommended.",
          rating: 5,
          isApproved: true,
        },
        {
          clientName: "J. Brown",
          displayName: "J. B.",
          content:
            "As a parent of a neurodivergent child, I found Dr. CBJ's guidance invaluable. Her training sessions for our school were practical and empowering.",
          rating: 5,
          isApproved: true,
        },
        {
          clientName: "K. Davis",
          displayName: "K. D.",
          content:
            "Professional, warm, and truly caring. Dr. CBJ's behavioural consultation helped our organisation create a more supportive environment for our students.",
          rating: 5,
          isApproved: true,
        },
      ],
    });
    console.log("Testimonials seeded.");
  }

  // Seed Wellness Resources
  const resourceCount = await prisma.wellnessResource.count();
  if (resourceCount === 0) {
    await prisma.wellnessResource.createMany({
      data: [
        {
          title: "Understanding Anxiety",
          category: "Stress Management",
          type: "ARTICLE",
          summary: "Learn about the signs of anxiety and practical coping strategies.",
          content:
            "Anxiety is a natural response to stress, but when it becomes overwhelming it can affect daily life. Common signs include persistent worry, restlessness, difficulty concentrating, and physical symptoms like rapid heartbeat. Practical coping strategies include deep breathing exercises, regular physical activity, maintaining a consistent sleep schedule, and breaking tasks into manageable steps. If anxiety significantly impacts your daily functioning, consider speaking with a mental health professional.",
        },
        {
          title: "4-7-8 Breathing Exercise",
          category: "Breathing Exercises",
          type: "EXERCISE",
          summary: "A calming breathing technique to reduce stress and promote relaxation.",
          content:
            "The 4-7-8 breathing technique is a simple yet powerful relaxation method. Sit comfortably with your back straight. Inhale quietly through your nose for 4 seconds. Hold your breath for 7 seconds. Exhale completely through your mouth for 8 seconds. Repeat this cycle 4 times. This technique activates the parasympathetic nervous system, helping to calm your body and mind.",
        },
        {
          title: "Mindfulness for Beginners",
          category: "Mindfulness",
          type: "ARTICLE",
          summary: "An introduction to mindfulness and how to practice it daily.",
          content:
            "Mindfulness is the practice of being fully present in the current moment without judgment. Start with just 5 minutes a day. Find a quiet space, sit comfortably, and focus on your breath. When your mind wanders, gently bring your attention back. Over time, mindfulness can reduce stress, improve focus, and enhance emotional wellbeing.",
        },
        {
          title: "Sleep Hygiene Tips",
          category: "Sleep Hygiene",
          type: "ARTICLE",
          summary: "Practical tips for improving your sleep quality.",
          content:
            "Good sleep hygiene is essential for mental and physical health. Maintain a consistent sleep schedule, even on weekends. Create a relaxing bedtime routine. Keep your bedroom cool, dark, and quiet. Avoid screens for at least an hour before bed. Limit caffeine and alcohol in the evening. Regular exercise can also improve sleep quality, but avoid vigorous activity close to bedtime.",
        },
        {
          title: "Emotional Regulation Strategies",
          category: "Emotional Regulation",
          type: "ARTICLE",
          summary: "Techniques to help manage and regulate your emotions.",
          content:
            "Emotional regulation is the ability to manage and respond to emotional experiences in healthy ways. Key strategies include: identifying and naming your emotions, practicing deep breathing when feeling overwhelmed, using positive self-talk, taking a pause before reacting, and engaging in activities that bring you joy. Remember that all emotions are valid - the goal is not to suppress them, but to respond to them constructively.",
        },
        {
          title: "Building Coping Skills",
          category: "Coping Skills",
          type: "ARTICLE",
          summary: "Develop healthy coping mechanisms for life's challenges.",
          content:
            "Healthy coping skills help you navigate life's challenges with resilience. These include problem-solving, seeking social support, practicing relaxation techniques, engaging in physical activity, maintaining a healthy routine, and expressing emotions through creative outlets. Avoid unhealthy coping mechanisms like substance use or social withdrawal. If you're struggling to cope, professional support can help you develop personalised strategies.",
        },
        {
          title: "Parenting a Neurodivergent Child",
          category: "Parenting Resources",
          type: "ARTICLE",
          summary: "Guidance and support for parents of neurodivergent children.",
          content:
            "Parenting a neurodivergent child comes with unique joys and challenges. Focus on understanding your child's individual needs and strengths. Create predictable routines and clear expectations. Celebrate their unique way of seeing the world. Seek support from professionals who specialise in neurodiversity. Connect with other parents who share similar experiences. Remember to care for your own wellbeing too - you can't pour from an empty cup.",
        },
        {
          title: "Understanding Neurodiversity",
          category: "Neurodiversity Resources",
          type: "ARTICLE",
          summary: "Learn about neurodiversity and how to support neurodivergent individuals.",
          content:
            "Neurodiversity recognises that neurological differences - such as autism, ADHD, dyslexia, and others - are natural variations of the human brain rather than deficits. Supporting neurodivergent individuals involves understanding their unique strengths and challenges, providing appropriate accommodations, and fostering inclusive environments. Professional assessment and support can help identify specific needs and develop effective strategies.",
        },
        {
          title: "Guided Meditation: Body Scan",
          category: "Meditation",
          type: "EXERCISE",
          summary: "A guided body scan meditation to promote deep relaxation.",
          content:
            "Find a comfortable position, either sitting or lying down. Close your eyes and take a few deep breaths. Begin by bringing your attention to your feet, noticing any sensations. Slowly move your attention up through your legs, torso, arms, neck, and head. Notice any areas of tension and imagine them softening with each exhale. Spend 10-15 minutes on this practice. This meditation helps reduce stress and increase body awareness.",
        },
        {
          title: "Daily Affirmations for Mental Wellness",
          category: "Stress Management",
          type: "ARTICLE",
          summary: "Positive affirmations to support your mental health journey.",
          content:
            "Positive affirmations are short, powerful statements that can help shift your mindset. Examples include: 'I am worthy of love and respect', 'I am capable of handling life's challenges', 'My feelings are valid', 'I am growing and healing every day', and 'I deserve peace and happiness'. Repeat your chosen affirmations daily, especially during challenging moments. Pair them with deep breathing for greater impact.",
        },
      ],
    });
    console.log("Wellness resources seeded.");
  }

  // Seed Announcements
  const announcementCount = await prisma.announcement.count();
  if (announcementCount === 0) {
    await prisma.announcement.createMany({
      data: [
        {
          title: "Welcome to Dr. CBJ Mental Wellness",
          body: "We are delighted to welcome you to our digital sanctuary. Explore our services, connect with our AI assistant, and begin your healing journey with us. If you have any questions, please don't hesitate to reach out at (876) 370-0095.",
          isActive: true,
        },
        {
          title: "Virtual Sessions Now Available",
          body: "For your convenience, we now offer virtual therapy and consultation sessions. Whether you're at home or abroad, you can access professional psychological support from anywhere.",
          isActive: true,
        },
      ],
    });
    console.log("Announcements seeded.");
  }

  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });