// AI Chat Assistant logic with crisis detection

const crisisKeywords = [
  "suicide",
  "kill myself",
  "end my life",
  "self-harm",
  "hurt myself",
  "harm myself",
  "cutting",
  "want to die",
  "no reason to live",
  "better off dead",
  "hurt someone",
  "kill someone",
  "harm others",
  "immediate danger",
  "emergency",
];

export function detectCrisis(input: string): boolean {
  const lower = input.toLowerCase();
  return crisisKeywords.some((keyword) => lower.includes(keyword));
}

export const crisisResponse = `I'm really concerned about what you've shared, and I want to make sure you're safe right now.

**If you are in immediate danger or thinking about harming yourself or others, please reach out for help right away:**

ðŸ‡¯ðŸ‡² **In Jamaica:**
- **Emergency Services:** 119 (Police) or 110 (Fire/Ambulance)
- **Crisis Hotline:** Contact your local mental health crisis line or go to the nearest hospital emergency room

ðŸŒ **International:**
- **United States:** 988 (Suicide and Crisis Lifeline)
- **United Kingdom:** 111 (NHS) or 999 (Emergency)
- **International:** Visit https://findahelpline.com for resources in your country

**Please do not face this alone.** You deserve support, and there are people who care about you and want to help.

I'm not able to provide crisis intervention, but I strongly encourage you to speak with a mental health professional or crisis service right away. You can also call Dr. CBJ's office at **(876) 370-0095** to schedule an urgent consultation.`;

export function generateResponse(input: string, history: { role: string; content: string }[] = []): string {
  const lower = input.toLowerCase();

  if (lower.includes("hello") || lower.includes("hi ") || lower === "hi" || lower.includes("hey")) {
    return `Hello! I'm so glad you're here. I'm Dr. CBJ's AI wellness assistant, here to offer a supportive space for you to talk about your feelings and concerns.

How are you feeling today? Remember, whatever you share with me is a step towards your wellbeing. If you'd like more personalised support, I'd encourage you to book an appointment with Dr. CBJ.`;
  }

  if (lower.includes("anxious") || lower.includes("anxiety") || lower.includes("worried") || lower.includes("nervous")) {
    return `I hear that you're feeling anxious, and that's completely valid. Anxiety is a common experience, and it's important to know that you're not alone in this.

Here are a few things that might help in the moment:
- **Take slow, deep breaths** - try breathing in for 4 counts, holding for 7, and exhaling for 8
- **Ground yourself** - notice 5 things you can see, 4 you can touch, 3 you can hear, 2 you can smell, and 1 you can taste
- **Be gentle with yourself** - anxiety doesn't define you

If anxiety is affecting your daily life, speaking with a professional can make a real difference. Dr. CBJ offers therapy and counselling services that can help you develop coping strategies. Would you like to know more about booking an appointment?`;
  }

  if (lower.includes("depress") || lower.includes("sad") || lower.includes("down") || lower.includes("hopeless") || lower.includes("empty")) {
    return `Thank you for sharing how you're feeling. It takes courage to acknowledge sadness or heaviness, and I want you to know that your feelings are valid.

When we're feeling low, even small steps can feel overwhelming. Here are some gentle suggestions:
- **Reach out** - connecting with someone you trust can help
- **Move your body** - even a short walk can shift your mood
- **Be kind to yourself** - you're doing the best you can

If these feelings persist, professional support can be truly transformative. Dr. CBJ provides compassionate, evidence-based therapy that can help you navigate these emotions. Would you like to learn more about how therapy could support you?`;
  }

  if (lower.includes("stress") || lower.includes("overwhelm") || lower.includes("burnout") || lower.includes("too much")) {
    return `I'm sorry to hear you're feeling stressed and overwhelmed. That's a lot to carry, and it's important to acknowledge the weight of it.

Here are some stress management techniques you might find helpful:
- **Prioritise and simplify** - focus on what truly matters today
- **Take regular breaks** - even 5 minutes of quiet can help reset
- **Practice self-care** - make time for activities that nourish you
- **Consider a relaxation exercise** - our Wellness Library has guided breathing and meditation exercises

Remember, stress is a signal that something needs attention. Dr. CBJ offers stress and anxiety management support that can help you build resilience. Would you like to explore that further?`;
  }

  if (lower.includes("sleep") || lower.includes("insomnia") || lower.includes("tired") || lower.includes("can't sleep")) {
    return `Sleep difficulties can really impact how we feel during the day. I'm glad you reached out about this.

Here are some sleep hygiene tips that may help:
- **Maintain a consistent sleep schedule** - even on weekends
- **Create a calming bedtime routine** - dim lights, avoid screens
- **Keep your bedroom cool, dark, and quiet**
- **Limit caffeine and alcohol in the evening**

If sleep problems persist, they can sometimes be linked to underlying stress or anxiety. Dr. CBJ can help you explore what might be affecting your sleep and develop strategies to improve it. Would you like more information?`;
  }

  if (lower.includes("relationship") || lower.includes("family") || lower.includes("partner") || lower.includes("marriage") || lower.includes("parent")) {
    return `Relationships and family dynamics can be complex and sometimes challenging. Thank you for trusting me with this.

Healthy communication is often at the heart of relationship challenges. Here are some thoughts:
- **Listen to understand** - not just to respond
- **Express your feelings** - using "I" statements can help
- **Set healthy boundaries** - this is an act of self-respect

Dr. CBJ offers parenting and family support services, as well as individual therapy that can help you navigate relationship challenges. Would you like to learn more about how these services could support you and your family?`;
  }

  if (lower.includes("child") || lower.includes("kid") || lower.includes("teen") || lower.includes("adolescent") || lower.includes("son") || lower.includes("daughter")) {
    return `Supporting a child or adolescent through their challenges is one of the most important - and sometimes most difficult - things a parent can do. I appreciate you reaching out.

Dr. CBJ specialises in child and adolescent services, including:
- Psychological and behavioural assessment
- Emotional regulation support
- Parent and caregiver consultation
- Behaviour intervention planning

Every child is unique, and a professional assessment can provide valuable insights into your child's needs and strengths. Would you like to know more about how Dr. CBJ can support your family?`;
  }

  if (lower.includes("adhd") || lower.includes("autism") || lower.includes("neurodiverg") || lower.includes("sen") || lower.includes("learning") || lower.includes("dyslexia")) {
    return `Thank you for sharing about neurodiversity or special educational needs. This is an area where Dr. CBJ has significant expertise.

Understanding and supporting neurodivergent individuals requires a thoughtful, individualised approach. Dr. CBJ offers:
- Neurodivergent child assessment and support
- SEN consultation
- Individual Learning Support Planning
- Behaviour management strategies
- Training for teachers, parents, and caregivers

Every neurodivergent person has unique strengths and needs. A professional assessment can help identify the right support strategies. Would you like to learn more?`;
  }

  if (lower.includes("therapy") || lower.includes("counselling") || lower.includes("counseling") || lower.includes("cbt") || lower.includes("treatment")) {
    return `I'm glad you're considering therapy or counselling - that's a powerful step towards healing and growth.

Dr. CBJ offers a range of therapeutic services, including:
- Individual therapy
- Cognitive Behavioural Therapy (CBT)
- Virtual therapy sessions
- Stress and anxiety management
- Coping skills development

Therapy provides a safe, confidential space to explore your thoughts and feelings with a professional who can help you develop effective strategies. Would you like to book an appointment or learn more about the process?`;
  }

  if (lower.includes("appointment") || lower.includes("book") || lower.includes("schedule") || lower.includes("session")) {
    return `I'd be happy to help you with booking an appointment with Dr. CBJ!

You can book directly through our **Book Appointment** page, where you'll be able to:
- Choose your preferred date and time
- Select your session type
- Choose in-person or virtual delivery

Or you can call our office at **(876) 370-0095** and our team will assist you.

Would you like me to guide you through the booking process?`;
  }

  if (lower.includes("contact") || lower.includes("phone") || lower.includes("email") || lower.includes("reach")) {
    return `Here's how you can reach Dr. CBJ's office:

**Manor Group Health+**
ðŸ“ Unit 7 Lower Manor Park Plaza, Kingston, Jamaica
ðŸ“ž **(876) 370-0095**

You can also use the **Contact** page to send a message, or book an appointment directly through the **Book Appointment** page.

Is there anything else I can help you with?`;
  }

  if (lower.includes("thank")) {
    return `You're so welcome. I'm here whenever you need a supportive space to talk.

Remember, taking care of your mental health is a journey, and every step counts. If you'd like more personalised support, Dr. CBJ is here for you - you can book an appointment or reach out at **(876) 370-0095**.

Is there anything else on your mind today?`;
  }

  return `Thank you for sharing that with me. I'm here to listen and support you in a warm, non-judgmental space.

While I can offer general wellness support and encouragement, I want to be clear that I'm not able to provide diagnoses or medical advice. For personalised support, I'd encourage you to speak with Dr. CBJ, who can offer professional guidance tailored to your needs.

Here are some things that might be helpful:
- **Explore our Wellness Library** - articles, breathing exercises, and meditation guides
- **Try a daily reflection** - journaling can help process emotions
- **Book an appointment** - professional support can make a real difference

Is there anything specific you'd like to talk about? I'm here for you.`;
}
