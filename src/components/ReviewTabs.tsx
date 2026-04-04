import { useState, useRef, useCallback } from "react";

type TabDef = { label: string; prompt: string };

const BUSINESS_TAB_MAP: Record<string, TabDef[]> = {
  restaurant: [
    { label: "Food Quality", prompt: "How was the taste, freshness, and presentation of the food? Any standout dishes worth mentioning?" },
    { label: "Service", prompt: "How was the service from the staff? Were they attentive, friendly, and responsive to your needs?" },
    { label: "Ambience", prompt: "Describe the atmosphere — lighting, music, décor, and overall vibe of the place." },
    { label: "Cleanliness", prompt: "Was the restaurant clean and well-maintained? How were the restrooms and dining area?" },
    { label: "Value for Money", prompt: "Did the food and experience justify the price? Would you say it's good value?" },
    { label: "Overall Experience", prompt: "Summarise your overall dining experience. Would you recommend this place to others?" },
  ],
  "ca firm": [
    { label: "Professionalism", prompt: "How professional and knowledgeable was the CA team? Mention their expertise or domain understanding." },
    { label: "Efficiency", prompt: "Were tasks and filings completed on time? How well did the team manage deadlines?" },
    { label: "Client Communication", prompt: "How responsive and clear was the team in their communication? Were updates provided proactively?" },
    { label: "Compliance & Ethics", prompt: "Did the firm follow proper compliance and ethical standards? Were they transparent in their approach?" },
    { label: "Value for Money", prompt: "Were the fees fair given the quality and scope of services provided?" },
    { label: "Overall Experience", prompt: "Summarise your overall experience with this firm. Would you recommend them?" },
  ],
  spa: [
    { label: "Therapist Skills", prompt: "How skilled was the therapist? Was the massage or treatment technique effective and comfortable?" },
    { label: "Ambience & Relaxation", prompt: "Describe the spa ambience — was it calming and relaxing? Music, lighting, fragrance?" },
    { label: "Cleanliness & Hygiene", prompt: "Was the spa clean and hygienic? Were towels, equipment, and rooms well-maintained?" },
    { label: "Treatment Effectiveness", prompt: "Did the treatment deliver the promised results? How did you feel afterwards?" },
    { label: "Booking & Staff", prompt: "How easy was the booking process? Was the front desk staff welcoming and helpful?" },
    { label: "Value for Money", prompt: "Was the spa experience worth the price? Would you consider it good value?" },
  ],
  salon: [
    { label: "Stylist Expertise", prompt: "How skilled was the stylist? Did they understand your requirements and deliver a great result?" },
    { label: "Service Quality", prompt: "How was the overall service? Were you treated well from start to finish?" },
    { label: "Hygiene & Cleanliness", prompt: "Was the salon clean? Were tools sanitised and the workspace well-maintained?" },
    { label: "Wait Time & Punctuality", prompt: "Were you attended to on time? How long did you have to wait, if at all?" },
    { label: "Product Range", prompt: "Did they use quality products? Were you offered options that suited your needs?" },
    { label: "Overall Experience", prompt: "Summarise your salon visit. Would you go back and recommend it to friends?" },
  ],
  hotel: [
    { label: "Room Quality", prompt: "How was the room — comfort, size, cleanliness, amenities, and bed quality?" },
    { label: "Staff & Service", prompt: "Were the hotel staff courteous and helpful? How was the check-in/check-out experience?" },
    { label: "Location & Accessibility", prompt: "Was the hotel conveniently located? How easy was it to reach nearby attractions or transport?" },
    { label: "Facilities", prompt: "How were the hotel facilities — pool, gym, restaurant, Wi-Fi, parking?" },
    { label: "Cleanliness", prompt: "Was the hotel well-maintained and clean, including common areas and restrooms?" },
    { label: "Value for Money", prompt: "Did the stay justify the room rate? Would you say it's good value for what you got?" },
  ],
  clinic: [
    { label: "Doctor / Specialist", prompt: "How knowledgeable and caring was the doctor? Did they listen to your concerns and explain clearly?" },
    { label: "Staff & Nursing", prompt: "How was the support staff — nurses, receptionists? Were they courteous and efficient?" },
    { label: "Wait Time", prompt: "How long did you wait for your appointment? Was the schedule managed well?" },
    { label: "Facilities & Hygiene", prompt: "Was the clinic clean and well-equipped? Were hygiene protocols followed?" },
    { label: "Treatment & Outcome", prompt: "Was the treatment effective? Are you satisfied with the diagnosis and results so far?" },
    { label: "Overall Experience", prompt: "Summarise your clinic visit. Would you recommend this clinic to others?" },
  ],
  gym: [
    { label: "Equipment & Facilities", prompt: "How was the equipment — variety, condition, and availability? Any standout facilities?" },
    { label: "Trainers & Staff", prompt: "Were the trainers knowledgeable and supportive? Did they help you reach your goals?" },
    { label: "Cleanliness", prompt: "Was the gym clean — floors, machines, washrooms, changing rooms?" },
    { label: "Classes & Programs", prompt: "Did they offer good group classes or training programmes? Were schedules convenient?" },
    { label: "Atmosphere & Community", prompt: "How was the vibe? Was it motivating and friendly, or crowded and uncomfortable?" },
    { label: "Value for Money", prompt: "Is the membership fee justified? Do you feel you're getting good value?" },
  ],
  school: [
    { label: "Teaching Quality", prompt: "How effective and engaging are the teachers? Do they go beyond textbooks to inspire learning?" },
    { label: "Curriculum & Academics", prompt: "Is the curriculum well-structured? Are academics balanced with extracurricular activities?" },
    { label: "Infrastructure", prompt: "How are the school's buildings, classrooms, labs, library, and sports facilities?" },
    { label: "Staff & Administration", prompt: "Is the administration responsive and supportive? How do they handle parent communication?" },
    { label: "Safety & Environment", prompt: "Does the school provide a safe and positive environment for children?" },
    { label: "Overall Experience", prompt: "Summarise your experience with this school. Would you recommend it to other parents?" },
  ],
  ecommerce: [
    { label: "Product Quality", prompt: "Was the product as described? How was the quality, material, and finish?" },
    { label: "Delivery & Packaging", prompt: "Was the delivery fast and on time? Was the packaging secure and presentable?" },
    { label: "Customer Support", prompt: "How was customer support — responsive, helpful, and easy to reach?" },
    { label: "Website / App Experience", prompt: "Was the website or app easy to use? How was the browsing and checkout experience?" },
    { label: "Return & Refund Policy", prompt: "Was the return/refund process smooth and fair? Any issues with exchanges?" },
    { label: "Overall Experience", prompt: "Summarise your shopping experience. Would you buy from them again?" },
  ],
  default: [
    { label: "Quality of Service", prompt: "How would you rate the quality of service provided? Was it up to your expectations?" },
    { label: "Staff & Team", prompt: "Were the staff friendly, professional, and helpful throughout your experience?" },
    { label: "Communication", prompt: "Was communication clear and timely? Were you kept informed at every step?" },
    { label: "Reliability & Timeliness", prompt: "Was the service delivered on time and as promised? Any delays or issues?" },
    { label: "Value for Money", prompt: "Was the pricing fair for the quality of service? Would you consider it good value?" },
    { label: "Overall Experience", prompt: "Summarise your overall experience. Would you recommend this business to others?" },
  ],
};

export function getTabsForBusiness(category: string | null | undefined): TabDef[] {
  const key = (category || "default").toLowerCase().trim();
  return BUSINESS_TAB_MAP[key] || BUSINESS_TAB_MAP["default"];
}

interface ReviewTabsProps {
  tabs: TabDef[];
  rating: number;
}

const ReviewTabs = ({ tabs, rating }: ReviewTabsProps) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [texts, setTexts] = useState<Record<number, string>>({});
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      let next = activeIndex;
      if (e.key === "ArrowRight") next = (activeIndex + 1) % tabs.length;
      else if (e.key === "ArrowLeft") next = (activeIndex - 1 + tabs.length) % tabs.length;
      else if (e.key === "Home") next = 0;
      else if (e.key === "End") next = tabs.length - 1;
      else return;
      e.preventDefault();
      setActiveIndex(next);
      tabRefs.current[next]?.focus();
    },
    [activeIndex, tabs.length]
  );

  const activeTab = tabs[activeIndex];

  return (
    <div className="mt-6">
      <div
        role="tablist"
        aria-label="Review dimensions"
        className="flex flex-wrap gap-2 mb-4"
        onKeyDown={handleKeyDown}
      >
        {tabs.map((tab, i) => (
          <button
            key={tab.label}
            ref={(el) => { tabRefs.current[i] = el; }}
            role="tab"
            id={`review-tab-${i}`}
            aria-selected={i === activeIndex}
            aria-controls={`review-tabpanel-${i}`}
            tabIndex={i === activeIndex ? 0 : -1}
            onClick={() => setActiveIndex(i)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${
              i === activeIndex
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-secondary text-secondary-foreground border-border hover:border-primary/50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div
        role="tabpanel"
        id={`review-tabpanel-${activeIndex}`}
        aria-labelledby={`review-tab-${activeIndex}`}
        className="bg-card rounded-xl border border-border p-5 shadow-card"
      >
        <p className="text-sm text-muted-foreground mb-3">{activeTab.prompt}</p>
        <textarea
          value={texts[activeIndex] || ""}
          onChange={(e) => setTexts((prev) => ({ ...prev, [activeIndex]: e.target.value }))}
          rows={3}
          placeholder={`Write about ${activeTab.label.toLowerCase()}…`}
          className="w-full rounded-xl border border-input bg-background p-4 text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>
    </div>
  );
};

export default ReviewTabs;
