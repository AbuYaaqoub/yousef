'use client';

import { useState, useEffect } from 'react';
import { 
    FileText, 
    Layers, 
    Link2, 
    Palette, 
    Plus, 
    Trash2, 
    Type, 
    Globe, 
    Copy, 
    Check, 
    Edit3, 
    Save, 
    X, 
    FolderGit2, 
    FileSpreadsheet, 
    Image, 
    BookOpen,
    Eye,
    Compass,
    Briefcase,
    AlertTriangle,
    Target,
    CalendarDays,
    Search,
    Store,
    Printer
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

interface Client {
    id: string;
    name: string;
    website: string;
}

interface ColorAsset {
    name: string;
    hex: string;
}

interface LinkAsset {
    id: string;
    name: string;
    url: string;
    type: 'logo' | 'guideline' | 'content_plan' | 'drive' | 'other';
}

interface ClientBriefData {
    // 17 أسئلة للتعاقد مع م/ أحمد خطاب
    company_intro: string;
    services_provided: string;
    service_steps: string;
    selling_points: string;
    marketing_problems: string;
    campaign_reason: string;
    company_strengths: string;
    target_client_detail: string;
    competitors_online_offline: string;
    contract_goal_khattab: string;
    campaign_message: string;
    audience_think_feel_do: string;
    meetings_reports_schedule: string;
    campaign_expectations: string;
    results_timeframe: string;
    final_decision_maker: string;
    religious_political_restrictions: string;
    summary?: string;
    colors: ColorAsset[];
    fonts: {
        primary: string;
        secondary: string;
    };
    links: LinkAsset[];
}

interface ClientBriefAssetsProps {
    selectedClient: Client;
    usingFallback: boolean;
}

const DEFAULT_BRIEF_DATA = (): ClientBriefData => ({
    company_intro: 'من هي الشركة وتاريخ تأسيسها وعمرها وخبرتها في السوق...',
    services_provided: 'ما هي الخدمات والمنتجات التي تقدمها الشركة لعملائها بالتفصيل؟...',
    service_steps: 'خطوات تقديم الخدمات من لحظة استلام الطلب وحتى تسليمه النهائي للعميل...',
    selling_points: 'ما هي نقاط البيع والميزات التنافسية الحالية للشركة التي تميزها عن غيرها؟...',
    marketing_problems: 'ما هي المشكلات أو العقبات التسويقية الحالية التي تواجه المبيعات أو ركود منتجات محددة؟...',
    campaign_reason: 'لماذا تقرر البدء في هذه الحملة حالياً؟ هل هو إطلاق جديد، زيادة مبيعات، أم مواجهة منافسة؟...',
    company_strengths: 'ما هي نقاط قوة الشركة البشرية (فريق العمل الخبير) والمادية (البنية التحتية، الأجهزة، المواد الفاخرة)؟...',
    target_client_detail: 'من هو عميلك المثالي المستهدف (Target Audience Persona) واهتماماته وسلوكه بالتفصيل؟...',
    competitors_online_offline: 'من هو المنافس لك في محركات البحث والإنترنت (مع روابط مواقعهم إن أمكن) والمنافسين على أرض الواقع؟...',
    contract_goal_khattab: 'ما هو الهدف الأساسي والتجاري الذي ترغبون في تحقيقه من التعاقد مع المستشار م/ أحمد خطاب؟...',
    campaign_message: 'ما هي الرسالة والتوجه الجوهري الذي ترغبون في إرساله من خلال الحملة وتثبيته في ذهن المستخدم؟...',
    audience_think_feel_do: 'عند الدخول للموقع: ما الذي يجب أن (يفكر فيه) العميل، وبماذا (يشعر)، وما الإجراء الذي (يفعله) مباشرة؟...',
    meetings_reports_schedule: 'مواعيد ووتيرة الاجتماعات الدورية المتفق عليها وتواريخ تسليم التقارير الفنية الدورية...',
    campaign_expectations: 'ما هي توقعاتكم وأرقامكم المستهدفة للحملة (نسبة زيادة المبيعات، تصدر الكلمات)؟...',
    results_timeframe: 'الوقت المتوقع للبدء في رؤية النتائج الملموسة للحملة (المتوقع عادة من ٣ إلى ٦ أشهر لضمان الصبر والعمل السليم)...',
    final_decision_maker: 'من هو صاحب الكلمة النهائية والمعتمد لاتخاذ القرارات مع م/ أحمد خطاب لتفادي تشتت القرار؟...',
    religious_political_restrictions: 'هل يوجد أي تقييد ديني أو سياسي أو أخلاقي يجب مراعاته وتجنبه نهائياً بالرسائل التسويقية والمحتوى؟...',
    summary: '',
    colors: [
        { name: 'اللون الأساسي للعلامة', hex: '#0F172A' },
        { name: 'اللون الثانوي التفاعلي', hex: '#D97706' },
        { name: 'لون الخلفيات الفاتحة', hex: '#F8FAFC' }
    ],
    fonts: {
        primary: 'Cairo',
        secondary: 'Inter'
    },
    links: []
});

export function ClientBriefAssets({ selectedClient, usingFallback }: ClientBriefAssetsProps) {
    const [briefData, setBriefData] = useState<ClientBriefData>(DEFAULT_BRIEF_DATA());
    const [isEditingBrief, setIsEditingBrief] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [activeSection, setActiveSection] = useState<'profile' | 'challenges' | 'campaign' | 'management'>('profile');
    
    // الحالات المؤقتة لحقول التعديل الـ 17 للبريف
    const [editCompanyIntro, setEditCompanyIntro] = useState('');
    const [editServicesProvided, setEditServicesProvided] = useState('');
    const [editServiceSteps, setEditServiceSteps] = useState('');
    const [editSellingPoints, setEditSellingPoints] = useState('');
    const [editMarketingProblems, setEditMarketingProblems] = useState('');
    const [editCampaignReason, setEditCampaignReason] = useState('');
    const [editCompanyStrengths, setEditCompanyStrengths] = useState('');
    const [editTargetClientDetail, setEditTargetClientDetail] = useState('');
    const [editCompetitorsOnlineOffline, setEditCompetitorsOnlineOffline] = useState('');
    const [editContractGoalKhattab, setEditContractGoalKhattab] = useState('');
    const [editCampaignMessage, setEditCampaignMessage] = useState('');
    const [editAudienceThinkFeelDo, setEditAudienceThinkFeelDo] = useState('');
    const [editMeetingsReportsSchedule, setEditMeetingsReportsSchedule] = useState('');
    const [editCampaignExpectations, setEditCampaignExpectations] = useState('');
    const [editResultsTimeframe, setEditResultsTimeframe] = useState('');
    const [editFinalDecisionMaker, setEditFinalDecisionMaker] = useState('');
    const [editReligiousPoliticalRestrictions, setEditReligiousPoliticalRestrictions] = useState('');
    
    // الحالات المؤقتة لإضافة أصل جديد (ألوان، روابط)
    const [newColorName, setNewColorName] = useState('');
    const [newColorHex, setNewColorHex] = useState('#000000');
    const [newLinkName, setNewLinkName] = useState('');
    const [newLinkUrl, setNewLinkUrl] = useState('');
    const [newLinkType, setNewLinkType] = useState<'logo' | 'guideline' | 'content_plan' | 'drive' | 'other'>('drive');
    
    // حالات تفاعلية
    const [copiedColorIndex, setCopiedColorIndex] = useState<number | null>(null);
    const [editFontsMode, setEditFontsMode] = useState(false);
    const [primaryFont, setPrimaryFont] = useState('Cairo');
    const [secondaryFont, setSecondaryFont] = useState('Inter');
    const [successSaveMsg, setSuccessSaveMsg] = useState('');
    const [isEditingSummary, setIsEditingSummary] = useState(false);
    const [editSummary, setEditSummary] = useState('');

    // --- حالات المتاجر المكتشفة (Leads) للمنافسين ---
    const [discoveredStores, setDiscoveredStores] = useState<{ id: string; store_name: string; store_url: string; website?: string }[]>([]);
    const [leadsSearchText, setLeadsSearchText] = useState('');
    const [selectedLeadId, setSelectedLeadId] = useState('');

    // تحميل البيانات عند اختيار العميل
    useEffect(() => {
        const loadBriefData = async () => {
            setIsLoading(true);
            setIsEditingBrief(false);
            setEditFontsMode(false);
            
            const localStorageKey = `seo_client_brief_assets_${selectedClient.id}`;
            
            if (usingFallback) {
                const cached = localStorage.getItem(localStorageKey);
                if (cached) {
                    try {
                        const parsed = JSON.parse(cached);
                        setBriefData(parsed);
                        syncFormStates(parsed);
                    } catch (e) {
                        const defaults = DEFAULT_BRIEF_DATA();
                        setBriefData(defaults);
                        syncFormStates(defaults);
                    }
                } else {
                    const defaults = DEFAULT_BRIEF_DATA();
                    setBriefData(defaults);
                    syncFormStates(defaults);
                }
                setIsLoading(false);
            } else {
                try {
                    // محاولة الاستعلام من Supabase
                    const { data, error } = await supabase
                        .from('seo_client_brief_assets')
                        .select('*')
                        .eq('client_id', selectedClient.id)
                        .single();

                    if (error) {
                        throw error;
                    }

                    if (data && data.brief_content) {
                        const parsedData: ClientBriefData = data.brief_content;
                        setBriefData(parsedData);
                        syncFormStates(parsedData);
                    } else {
                        throw new Error('No content found');
                    }
                } catch (err: any) {
                    console.log('Brief table query failed, resorting to localStorage:', err.message);
                    const cached = localStorage.getItem(localStorageKey);
                    if (cached) {
                        try {
                            const parsed = JSON.parse(cached);
                            setBriefData(parsed);
                            syncFormStates(parsed);
                        } catch (e) {
                            const defaults = DEFAULT_BRIEF_DATA();
                            setBriefData(defaults);
                            syncFormStates(defaults);
                        }
                    } else {
                        const defaults = DEFAULT_BRIEF_DATA();
                        setBriefData(defaults);
                        syncFormStates(defaults);
                    }
                } finally {
                    setIsLoading(false);
                }
            }
        };

        if (selectedClient) {
            loadBriefData();
        }
    }, [selectedClient, usingFallback]);

    // جلب قائمة المتاجر المكتشفة ديناميكياً
    useEffect(() => {
        const fetchDiscoveredLeads = async () => {
            try {
                if (!usingFallback) {
                    const { data, error } = await supabase
                        .from('leads')
                        .select('id, store_name, store_url, website')
                        .order('store_name', { ascending: true });
                    
                    if (error) throw error;
                    if (data) {
                        setDiscoveredStores(data.map(d => ({
                            id: d.id,
                            store_name: d.store_name,
                            store_url: d.store_url,
                            website: d.website || d.store_url
                        })));
                    }
                } else {
                    const cachedLeads = localStorage.getItem('seo_discovered_leads');
                    if (cachedLeads) {
                        setDiscoveredStores(JSON.parse(cachedLeads));
                    }
                }
            } catch (err) {
                console.warn('Failed to load discovered leads for competitor select:', err);
                const cachedLeads = localStorage.getItem('seo_discovered_leads');
                if (cachedLeads) {
                    setDiscoveredStores(JSON.parse(cachedLeads));
                }
            }
        };

        fetchDiscoveredLeads();
    }, [selectedClient, usingFallback]);

    const syncFormStates = (data: ClientBriefData) => {
        setEditCompanyIntro(data.company_intro || '');
        setEditServicesProvided(data.services_provided || '');
        setEditServiceSteps(data.service_steps || '');
        setEditSellingPoints(data.selling_points || '');
        setEditMarketingProblems(data.marketing_problems || '');
        setEditCampaignReason(data.campaign_reason || '');
        setEditCompanyStrengths(data.company_strengths || '');
        setEditTargetClientDetail(data.target_client_detail || '');
        setEditCompetitorsOnlineOffline(data.competitors_online_offline || '');
        setEditContractGoalKhattab(data.contract_goal_khattab || '');
        setEditCampaignMessage(data.campaign_message || '');
        setEditAudienceThinkFeelDo(data.audience_think_feel_do || '');
        setEditMeetingsReportsSchedule(data.meetings_reports_schedule || '');
        setEditCampaignExpectations(data.campaign_expectations || '');
        setEditResultsTimeframe(data.results_timeframe || '');
        setEditFinalDecisionMaker(data.final_decision_maker || '');
        setEditReligiousPoliticalRestrictions(data.religious_political_restrictions || '');
        setPrimaryFont(data.fonts?.primary || 'Cairo');
        setSecondaryFont(data.fonts?.secondary || 'Inter');
        setEditSummary(data.summary || '');
    };

    // حفظ التغييرات بقاعدة الكاش المحلي وقاعدة البيانات الفعالة
    const saveBriefData = async (updatedData: ClientBriefData) => {
        const localStorageKey = `seo_client_brief_assets_${selectedClient.id}`;
        
        localStorage.setItem(localStorageKey, JSON.stringify(updatedData));
        setBriefData(updatedData);

        if (!usingFallback) {
            try {
                const { data: checkData, error: checkError } = await supabase
                    .from('seo_client_brief_assets')
                    .select('id')
                    .eq('client_id', selectedClient.id);

                if (checkError) throw checkError;

                if (checkData && checkData.length > 0) {
                    const { error: updateError } = await supabase
                        .from('seo_client_brief_assets')
                        .update({ brief_content: updatedData })
                        .eq('client_id', selectedClient.id);
                    
                    if (updateError) throw updateError;
                } else {
                    const { error: insertError } = await supabase
                        .from('seo_client_brief_assets')
                        .insert([{ client_id: selectedClient.id, brief_content: updatedData }]);
                    
                    if (insertError) throw insertError;
                }
            } catch (err: any) {
                console.warn('⚠️ Safe Fallback: Supabase update failed, preserved locally:', err.message);
            }
        }

        setSuccessSaveMsg('تم حفظ البريف بنجاح! 💾✨');
        setTimeout(() => setSuccessSaveMsg(''), 2000);
    };

    const handleSaveBriefText = async () => {
        const updated: ClientBriefData = {
            ...briefData,
            company_intro: editCompanyIntro,
            services_provided: editServicesProvided,
            service_steps: editServiceSteps,
            selling_points: editSellingPoints,
            marketing_problems: editMarketingProblems,
            campaign_reason: editCampaignReason,
            company_strengths: editCompanyStrengths,
            target_client_detail: editTargetClientDetail,
            competitors_online_offline: editCompetitorsOnlineOffline,
            contract_goal_khattab: editContractGoalKhattab,
            campaign_message: editCampaignMessage,
            audience_think_feel_do: editAudienceThinkFeelDo,
            meetings_reports_schedule: editMeetingsReportsSchedule,
            campaign_expectations: editCampaignExpectations,
            results_timeframe: editResultsTimeframe,
            final_decision_maker: editFinalDecisionMaker,
            religious_political_restrictions: editReligiousPoliticalRestrictions
        };
        await saveBriefData(updated);
        setIsEditingBrief(false);
    };

    const handleSaveSummary = async () => {
        const updated: ClientBriefData = {
            ...briefData,
            summary: editSummary
        };
        await saveBriefData(updated);
        setIsEditingSummary(false);
    };

    const handleSaveFonts = async () => {
        const updated: ClientBriefData = {
            ...briefData,
            fonts: {
                primary: primaryFont,
                secondary: secondaryFont
            }
        };
        await saveBriefData(updated);
        setEditFontsMode(false);
    };

    const handleAddColor = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newColorName.trim() || !newColorHex.startsWith('#')) return;

        const updatedColors = [...briefData.colors, { name: newColorName, hex: newColorHex }];
        const updated: ClientBriefData = {
            ...briefData,
            colors: updatedColors
        };
        
        await saveBriefData(updated);
        setNewColorName('');
        setNewColorHex('#000000');
    };

    const handleDeleteColor = async (index: number) => {
        const updatedColors = briefData.colors.filter((_, i) => i !== index);
        const updated: ClientBriefData = {
            ...briefData,
            colors: updatedColors
        };
        await saveBriefData(updated);
    };

    const handleAddLink = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newLinkName.trim() || !newLinkUrl.trim()) return;

        let formattedUrl = newLinkUrl.trim();
        if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
            formattedUrl = `https://${formattedUrl}`;
        }

        const newLink: LinkAsset = {
            id: `link-${Date.now()}`,
            name: newLinkName,
            url: formattedUrl,
            type: newLinkType
        };

        const updatedLinks = [...briefData.links, newLink];
        const updated: ClientBriefData = {
            ...briefData,
            links: updatedLinks
        };

        await saveBriefData(updated);
        setNewLinkName('');
        setNewLinkUrl('');
        setNewLinkType('drive');
    };

    const handleDeleteLink = async (id: string) => {
        if (!confirm('هل أنت متأكد من رغبتك في حذف هذا الملف المرجعي؟')) return;
        const updatedLinks = briefData.links.filter(l => l.id !== id);
        const updated: ClientBriefData = {
            ...briefData,
            links: updatedLinks
        };
        await saveBriefData(updated);
    };

    const copyColorToClipboard = (hex: string, index: number) => {
        navigator.clipboard.writeText(hex);
        setCopiedColorIndex(index);
        setTimeout(() => setCopiedColorIndex(null), 1500);
    };

    const handleExportPDF = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            alert('يرجى السماح بفتح النوافذ المنبثقة لتتمكن من تحميل ملف الـ PDF');
            return;
        }

        // تحضير ألوان الهوية
        const colorsHtml = briefData.colors && briefData.colors.length > 0
            ? briefData.colors.map(color => `
                <div style="border: 1px solid #e2e8f0; padding: 10px; border-radius: 12px; display: flex; align-items: center; gap: 10px; background: #ffffff;">
                    <div style="width: 28px; height: 28px; border-radius: 6px; border: 1px solid #cbd5e1; background-color: ${color.hex}; flex-shrink: 0;"></div>
                    <div style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                        <div style="font-size: 11px; font-weight: bold; color: #1e293b;">${color.name}</div>
                        <div style="font-size: 9px; font-family: monospace; color: #64748b; text-transform: uppercase;">${color.hex}</div>
                    </div>
                </div>
            `).join('')
            : '<p style="font-size: 11px; color: #94a3b8; grid-column: span 3; text-align: center;">لم يتم تعيين أي ألوان للهوية البصرية بعد</p>';

        // تحضير الروابط والأصول المرجعية
        const linksHtml = briefData.links && briefData.links.length > 0 
            ? briefData.links.map(link => {
                let badge = 'رابط مرجعي';
                if (link.type === 'logo') badge = 'شعار العميل';
                if (link.type === 'guideline') badge = 'دليل الهوية';
                if (link.type === 'content_plan') badge = 'خطة السيو والمحتوى';
                if (link.type === 'drive') badge = 'مجلد Drive المشترك';

                return `
                    <div style="border: 1px solid #e2e8f0; padding: 10px 15px; border-radius: 12px; display: flex; justify-content: space-between; align-items: center; background: #ffffff; margin-bottom: 8px;">
                        <div>
                            <span style="font-size: 11px; font-weight: bold; color: #1e293b; display: block; margin-bottom: 2px;">${link.name}</span>
                            <span style="font-size: 9px; background: #f1f5f9; color: #475569; padding: 2px 6px; border-radius: 4px; font-weight: bold;">${badge}</span>
                        </div>
                        <a href="${link.url}" target="_blank" style="font-size: 10px; color: #2563eb; text-decoration: underline; font-family: monospace; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 250px;">
                            ${link.url.replace(/^https?:\/\//, '')}
                        </a>
                    </div>
                `;
            }).join('')
            : '<p style="font-size: 11px; color: #94a3b8; text-align: center; width: 100%;">لا توجد ملفات مرجعية مسجلة حالياً</p>';

        // تحضير الملخص التنفيذي للـ PDF
        const summaryHtml = briefData.summary
            ? `
                <div class="section-container">
                    <h3 class="section-title">الملخص التنفيذي للبريف والاتفاق</h3>
                    <div style="border: 1px solid #e2e8f0; padding: 12px 15px; border-radius: 12px; background: #f8fafc; font-size: 10px; text-align: justify; white-space: pre-line; color: #334155; line-height: 1.6; page-break-inside: avoid;">
                        ${briefData.summary.replace(/\n/g, '<br/>')}
                    </div>
                </div>
            `
            : '';

        // محتويات الأسئلة الـ 17
        const sections = [
            {
                title: "1. البزنس ونقاط القوة التجارية",
                questions: [
                    { q: "من هي الشركة وتاريخ تأسيسها وعمرها وخبرتها في السوق؟", a: briefData.company_intro },
                    { q: "ما هي الخدمات والمنتجات التي تقدمها الشركة لعملائها بالتفصيل؟", a: briefData.services_provided },
                    { q: "خطوات تقديم الخدمات من لحظة استلام الطلب وحتى تسليمه النهائي؟", a: briefData.service_steps },
                    { q: "ما هي نقاط قوة الشركة البشرية (الخبرات) والمادية (البنية التحتية)؟", a: briefData.company_strengths },
                    { q: "ما هي نقاط البيع والميزات التنافسية الحالية للشركة التي تميزها؟", a: briefData.selling_points }
                ]
            },
            {
                title: "2. المستهدفين والتحديات التسويقية",
                questions: [
                    { q: "ما هي المشكلات أو العقبات التسويقية الحالية التي تواجه المبيعات؟", a: briefData.marketing_problems },
                    { q: "من هو عميلك المثالي المستهدف (Audience Persona) واهتماماته وسلوكه؟", a: briefData.target_client_detail },
                    { q: "من هو المنافس لك في محركات البحث وفي أرض الواقع؟", a: briefData.competitors_online_offline },
                    { q: "هل يوجد أي تقييد ديني أو سياسي أو أخلاقي يجب تجنبه بالرسائل والمحتوى؟", a: briefData.religious_political_restrictions }
                ]
            },
            {
                title: "3. الحملة والرسائل الإعلانية الجوهرية",
                questions: [
                    { q: "ما الهدف الأساسي والتجاري الذي ترغبون في تحقيقه من التعاقد مع م/ أحمد خطاب؟", a: briefData.contract_goal_khattab },
                    { q: "لماذا تقرر البدء في هذه الحملة حالياً؟ (إطلاق جديد، زيادة مبيعات، منافسة...)", a: briefData.campaign_reason },
                    { q: "ما هي الرسالة والتوجه الجوهري الذي ترغبون في إرساله وتثبيته في ذهن المستخدم؟", a: briefData.campaign_message },
                    { q: "عند دخول المتجر: ما الذي يجب أن (يفكر فيه) العميل، وبماذا (يشعر)، وما (يفعله) مباشرة؟", a: briefData.audience_think_feel_do }
                ]
            },
            {
                title: "4. الإدارة والجدول الزمني والتوقعات",
                questions: [
                    { q: "ما هي توقعاتكم وأرقامكم المستهدفة للحملة (زيادة المبيعات، تصدر الكلمات)؟", a: briefData.campaign_expectations },
                    { q: "الوقت المتوقع للبدء في رؤية النتائج الملموسة للحملة؟", a: briefData.results_timeframe },
                    { q: "من هو صاحب الكلمة النهائية والمعتمد لاتخاذ القرارات لتفادي تشتت القرار؟", a: briefData.final_decision_maker },
                    { q: "مواعيد ووتيرة الاجتماعات الدورية وتواريخ تسليم التقارير الفنية؟", a: briefData.meetings_reports_schedule }
                ]
            }
        ];

        const sectionsHtml = sections.map(sec => `
            <div class="section-container">
                <h3 class="section-title">${sec.title}</h3>
                ${sec.questions.map((q, idx) => `
                    <div class="question-block">
                        <div class="question-label">${idx + 1}. ${q.q}</div>
                        <div class="answer-text">${q.a ? q.a.replace(/\n/g, '<br/>') : '---'}</div>
                    </div>
                `).join('')}
            </div>
        `).join('');

        const formattedDate = new Date().toLocaleDateString('ar-SA', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        const htmlContent = `
            <!DOCTYPE html>
            <html dir="rtl" lang="ar">
            <head>
                <meta charset="UTF-8">
                <title>وثيقة بريف العميل - ${selectedClient.name}</title>
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap');
                    
                    @page {
                        size: A4;
                        margin: 15mm 15mm 20mm 15mm;
                    }
                    
                    * {
                        box-sizing: border-box;
                    }
                    
                    body {
                        font-family: 'Cairo', sans-serif;
                        color: #0f172a;
                        background: #ffffff;
                        line-height: 1.6;
                        margin: 0;
                        padding: 0;
                        font-size: 11px;
                    }
                    
                    .header-container {
                        border-bottom: 2px solid #0f172a;
                        padding-bottom: 12px;
                        margin-bottom: 20px;
                        display: flex;
                        justify-content: space-between;
                        align-items: flex-end;
                    }
                    
                    .header-title-section h1 {
                        font-size: 18px;
                        font-weight: 900;
                        margin: 0 0 4px 0;
                        color: #0f172a;
                    }
                    
                    .header-title-section p {
                        font-size: 9px;
                        color: #64748b;
                        margin: 0;
                        font-weight: bold;
                    }
                    
                    .header-info-section {
                        text-align: left;
                        font-size: 9px;
                        color: #475569;
                    }
                    
                    .header-info-section div {
                        margin-bottom: 2px;
                    }
                    
                    .section-container {
                        margin-bottom: 22px;
                        page-break-inside: avoid;
                    }
                    
                    .section-title {
                        font-size: 12px;
                        font-weight: 900;
                        background: #0f172a;
                        color: #ffffff;
                        padding: 5px 10px;
                        border-radius: 5px;
                        margin: 0 0 12px 0;
                    }
                    
                    .visual-identity-grid {
                        display: grid;
                        grid-template-columns: 2fr 1fr;
                        gap: 15px;
                        margin-bottom: 15px;
                    }
                    
                    .colors-list-grid {
                        display: grid;
                        grid-template-columns: repeat(3, 1fr);
                        gap: 10px;
                    }
                    
                    .question-block {
                        margin-bottom: 12px;
                        padding: 0 4px;
                        page-break-inside: avoid;
                    }
                    
                    .question-label {
                        font-size: 10px;
                        font-weight: bold;
                        color: #0f172a;
                        border-bottom: 1px solid #e2e8f0;
                        padding-bottom: 3px;
                        margin-bottom: 5px;
                    }
                    
                    .answer-text {
                        font-size: 10px;
                        color: #334155;
                        text-align: justify;
                        white-space: pre-line;
                    }
                    
                    .signatures-container {
                        margin-top: 40px;
                        display: flex;
                        justify-content: space-between;
                        page-break-inside: avoid;
                    }
                    
                    .signature-box {
                        text-align: center;
                        width: 45%;
                        border-top: 1px dashed #94a3b8;
                        padding-top: 10px;
                    }
                    
                    .signature-box strong {
                        font-size: 10.5px;
                        color: #0f172a;
                        display: block;
                        margin-bottom: 20px;
                    }
                    
                    .signature-field {
                        font-size: 9px;
                        color: #64748b;
                        margin-bottom: 4px;
                        text-align: right;
                        padding-right: 15%;
                    }
                    
                    .footer-banner {
                        position: fixed;
                        bottom: 0;
                        left: 0;
                        right: 0;
                        text-align: center;
                        font-size: 8px;
                        color: #94a3b8;
                        border-top: 1px solid #f1f5f9;
                        padding-top: 4px;
                        font-weight: bold;
                    }
                    
                    @media print {
                        body {
                            background: white;
                        }
                        .no-print {
                            display: none;
                        }
                        .visual-identity-grid {
                            display: flex;
                            gap: 15px;
                        }
                        .visual-identity-grid > div:first-child {
                            flex: 2;
                        }
                        .visual-identity-grid > div:last-child {
                            flex: 1;
                        }
                        .colors-list-grid {
                            display: flex;
                            gap: 10px;
                        }
                        .colors-list-grid > div {
                            flex: 1;
                        }
                    }
                </style>
            </head>
            <body>
                <!-- رأس الصفحة -->
                <div class="header-container">
                    <div class="header-title-section">
                        <h1>وثيقة بريف العميل وبنود التعاقد</h1>
                        <p>استمارة التعاقد المعتمدة مع المستشار م/ أحمد خطاب</p>
                    </div>
                    <div class="header-info-section">
                        <div><strong>العميل:</strong> ${selectedClient.name}</div>
                        <div><strong>الموقع الإلكتروني:</strong> ${selectedClient.website}</div>
                        <div><strong>تاريخ التصدير:</strong> ${formattedDate}</div>
                    </div>
                </div>

                <!-- الهوية البصرية والخطوط -->
                <div class="section-container">
                    <h3 class="section-title">الهوية البصرية والخطوط المعتمدة</h3>
                    <div class="visual-identity-grid">
                        <div class="colors-list-grid">
                            ${colorsHtml}
                        </div>
                        <div style="border: 1px solid #e2e8f0; padding: 10px; border-radius: 12px; background: #f8fafc; display: flex; flex-direction: column; justify-content: center; gap: 4px;">
                            <div style="font-size: 9px; font-weight: bold; color: #64748b;">الخطوط المعتمدة:</div>
                            <div style="font-size: 10.5px;"><strong>الخط الأساسي:</strong> ${briefData.fonts?.primary || 'Cairo'}</div>
                            <div style="font-size: 10.5px;"><strong>الخط الفرعي:</strong> ${briefData.fonts?.secondary || 'Inter'}</div>
                        </div>
                    </div>
                </div>

                <!-- الملفات والأصول المرجعية -->
                <div class="section-container">
                    <h3 class="section-title">الأصول والملفات المرجعية المشتركة</h3>
                    <div>
                        ${linksHtml}
                    </div>
                </div>

                <!-- ملخص البريف والاتفاق -->
                ${summaryHtml}

                <div style="page-break-before: always;"></div>

                <!-- الأسئلة الـ 17 للتعاقد -->
                ${sectionsHtml}

                <!-- توقيعات الاعتماد -->
                <div class="signatures-container">
                    <div class="signature-box">
                        <strong>اعتماد العميل / ممثل الشركة</strong>
                        <div class="signature-field">الاسم المعتمد: ___________________</div>
                        <div class="signature-field">التوقيع / الختم: ___________________</div>
                        <div class="signature-field">التاريخ: ____ / ____ / ________ م</div>
                    </div>
                    <div class="signature-box">
                        <strong>اعتماد المستشار م/ أحمد خطاب</strong>
                        <div class="signature-field">التوقيع: _______________________</div>
                        <div class="signature-field">التاريخ: ____ / ____ / ________ م</div>
                    </div>
                </div>

                <!-- تذييل الصفحة -->
                <div class="footer-banner">
                    وثيقة معتمدة ومصدرة إلكترونياً عبر نظام SallaHunter Pro &copy; 2026
                </div>

                <script>
                    window.onload = function() {
                        window.print();
                        // إغلاق النافذة المنبثقة تلقائياً بعد انتهاء الطباعة أو الإلغاء
                        setTimeout(function() {
                            window.close();
                        }, 500);
                    };
                <\/script>
            </body>
            </html>
        `;

        printWindow.document.open();
        printWindow.document.write(htmlContent);
        printWindow.document.close();
    };

    const getLinkIcon = (type: string) => {
        switch (type) {
            case 'logo':
                return <Image className="text-rose-500" size={18} />;
            case 'guideline':
                return <BookOpen className="text-indigo-500" size={18} />;
            case 'content_plan':
                return <FileSpreadsheet className="text-emerald-500" size={18} />;
            case 'drive':
                return <FolderGit2 className="text-amber-500" size={18} />;
            default:
                return <Link2 className="text-slate-500" size={18} />;
        }
    };

    const getLinkTypeBadge = (type: string) => {
        switch (type) {
            case 'logo':
                return <span className="bg-rose-50 text-rose-700 border border-rose-100 text-[9px] font-black px-2 py-0.5 rounded-full">شعار العميل</span>;
            case 'guideline':
                return <span className="bg-indigo-50 text-indigo-700 border border-indigo-100 text-[9px] font-black px-2 py-0.5 rounded-full">دليل الهوية</span>;
            case 'content_plan':
                return <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-[9px] font-black px-2 py-0.5 rounded-full">خطة السيو والمحتوى</span>;
            case 'drive':
                return <span className="bg-amber-50 text-amber-700 border border-amber-100 text-[9px] font-black px-2 py-0.5 rounded-full">مجلد Drive المشترك</span>;
            default:
                return <span className="bg-slate-50 text-slate-700 border border-slate-100 text-[9px] font-black px-2 py-0.5 rounded-full">رابط مرجعي</span>;
        }
    };

    // تصفية وخفض حجم خيارات المتاجر المكتشفة تسريعاً للأداء
    const filteredLeads = discoveredStores.filter(store => 
        store.store_name.toLowerCase().includes(leadsSearchText.toLowerCase()) ||
        store.store_url.toLowerCase().includes(leadsSearchText.toLowerCase()) ||
        (store.website && store.website.toLowerCase().includes(leadsSearchText.toLowerCase()))
    ).slice(0, 100);

    const insertDiscoveredLeadAsCompetitor = () => {
        const lead = discoveredStores.find(d => d.id === selectedLeadId);
        if (lead) {
            const competitorString = `\n- ${lead.store_name} (${lead.website || lead.store_url})`;
            setEditCompetitorsOnlineOffline(prev => `${prev}${competitorString}`.trim());
            setSelectedLeadId('');
            setLeadsSearchText('');
        }
    };

    if (isLoading) {
        return (
            <div className="bg-white border border-slate-200/80 rounded-[32px] p-12 text-center shadow-sm space-y-3">
                <div className="w-10 h-10 border-4 border-slate-100 border-t-black rounded-full animate-spin mx-auto" />
                <p className="text-xs font-bold text-slate-400">جاري تحميل استمارة البريف المخصصة والأسس...</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start animate-in">
            {/* رسالة الحفظ */}
            {successSaveMsg && (
                <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[200] bg-zinc-950 border border-zinc-800 text-white font-black text-xs py-3.5 px-7 rounded-2xl shadow-xl animate-bounce">
                    {successSaveMsg}
                </div>
            )}

            {/* الجزء الأيمن: البريف المطور لأسئلة م/ أحمد خطاب الـ 17 والملخص المضاف */}
            <div className="xl:col-span-8 space-y-8">
                
                {/* استمارة الأسئلة الـ 17 */}
                <div className="bg-white border border-slate-200/80 rounded-[32px] overflow-hidden shadow-sm p-6 sm:p-8 space-y-6">
                
                {/* الترويسة الفنية */}
                <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-100 pb-5">
                    <div className="flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-black text-white">
                            <FileText size={18} />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-slate-900">استمارة بريف وبنود التعاقد</h3>
                            <p className="text-[10px] text-slate-400 font-bold mt-0.5">صياغة وتوثيق كافة المتطلبات الـ 17 الفنية المعتمدة للتعاقد مع المستشار م/ أحمد خطاب</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        {isEditingBrief ? (
                            <>
                                <button
                                    onClick={handleSaveBriefText}
                                    className="flex items-center gap-1.5 px-4.5 py-2.5 rounded-2xl bg-black text-white hover:bg-zinc-800 text-xs font-black transition-all shadow-sm"
                                >
                                    <Save size={14} />
                                    <span>حفظ بنود البريف</span>
                                </button>
                                <button
                                    onClick={() => {
                                        syncFormStates(briefData);
                                        setIsEditingBrief(false);
                                    }}
                                    className="flex items-center gap-1 px-3.5 py-2.5 rounded-2xl border border-zinc-200 text-zinc-500 hover:text-black hover:bg-zinc-50 text-xs font-black transition-all"
                                >
                                    <X size={14} />
                                    <span>إلغاء</span>
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    onClick={handleExportPDF}
                                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl border border-zinc-200 bg-zinc-50 text-zinc-700 hover:border-black hover:text-black hover:bg-zinc-100 text-xs font-black transition-all shadow-sm"
                                    title="تحميل البريف كملف PDF للطباعة"
                                >
                                    <Printer size={14} />
                                    <span>تحميل PDF</span>
                                </button>
                                <button
                                    onClick={() => setIsEditingBrief(true)}
                                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl border border-zinc-200 text-zinc-700 hover:border-black hover:text-black hover:bg-zinc-50 text-xs font-black transition-all shadow-sm"
                                >
                                    <Edit3 size={14} />
                                    <span>تعديل الأسئلة الـ 17</span>
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* شريط تبويبات الأسئلة الأربعة */}
                <div className="flex items-center gap-1.5 p-1 bg-slate-50 border border-slate-200/50 rounded-2xl overflow-x-auto">
                    <button
                        onClick={() => setActiveSection('profile')}
                        className={cn(
                            "flex-1 py-2.5 px-4 text-[10.5px] font-black rounded-xl transition-all text-center flex items-center justify-center gap-1.5 whitespace-nowrap",
                            activeSection === 'profile'
                                ? "bg-white border border-slate-200 text-slate-900 shadow-sm"
                                : "text-slate-500 hover:text-slate-900"
                        )}
                    >
                        <Briefcase size={13} />
                        <span>البزنس والقوة 💼</span>
                    </button>
                    <button
                        onClick={() => setActiveSection('challenges')}
                        className={cn(
                            "flex-1 py-2.5 px-4 text-[10.5px] font-black rounded-xl transition-all text-center flex items-center justify-center gap-1.5 whitespace-nowrap",
                            activeSection === 'challenges'
                                ? "bg-white border border-slate-200 text-slate-900 shadow-sm"
                                : "text-slate-500 hover:text-slate-900"
                        )}
                    >
                        <AlertTriangle size={13} />
                        <span>المستهدفين والتحديات 🎯</span>
                    </button>
                    <button
                        onClick={() => setActiveSection('campaign')}
                        className={cn(
                            "flex-1 py-2.5 px-4 text-[10.5px] font-black rounded-xl transition-all text-center flex items-center justify-center gap-1.5 whitespace-nowrap",
                            activeSection === 'campaign'
                                ? "bg-white border border-slate-200 text-slate-900 shadow-sm"
                                : "text-slate-500 hover:text-slate-900"
                        )}
                    >
                        <Target size={13} />
                        <span>الحملة والرسالة 🚀</span>
                    </button>
                    <button
                        onClick={() => setActiveSection('management')}
                        className={cn(
                            "flex-1 py-2.5 px-4 text-[10.5px] font-black rounded-xl transition-all text-center flex items-center justify-center gap-1.5 whitespace-nowrap",
                            activeSection === 'management'
                                ? "bg-white border border-slate-200 text-slate-900 shadow-sm"
                                : "text-slate-500 hover:text-slate-900"
                        )}
                    >
                        <CalendarDays size={13} />
                        <span>الإدارة والتوقعات 📅</span>
                    </button>
                </div>

                {/* الحقول والأسئلة حسب التبويب النشط */}
                <div className="space-y-6 pt-2">
                    
                    {/* التبويب الأول: البزنس والقوة */}
                    {activeSection === 'profile' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* 1. من هي الشركة */}
                            <div className="p-5 border border-slate-100 rounded-2xl bg-slate-50/50 space-y-2.5">
                                <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                                    من هي الشركة؟ (التعريف والتاريخ)
                                </h4>
                                {isEditingBrief ? (
                                    <textarea
                                        value={editCompanyIntro}
                                        onChange={(e) => setEditCompanyIntro(e.target.value)}
                                        rows={4}
                                        className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-bold outline-none focus:border-black transition-all"
                                    />
                                ) : (
                                    <p className="text-xs font-bold leading-relaxed text-slate-500 whitespace-pre-line">{briefData.company_intro}</p>
                                )}
                            </div>

                            {/* 2. ما الخدمات التي تقدمها */}
                            <div className="p-5 border border-slate-100 rounded-2xl bg-slate-50/50 space-y-2.5">
                                <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                                    ما هي الخدمات والمنتجات التي تقدمها؟
                                </h4>
                                {isEditingBrief ? (
                                    <textarea
                                        value={editServicesProvided}
                                        onChange={(e) => setEditServicesProvided(e.target.value)}
                                        rows={4}
                                        className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-bold outline-none focus:border-black transition-all"
                                    />
                                ) : (
                                    <p className="text-xs font-bold leading-relaxed text-slate-500 whitespace-pre-line">{briefData.services_provided}</p>
                                )}
                            </div>

                            {/* 3. خطوات تقديم الخدمات */}
                            <div className="p-5 border border-slate-100 rounded-2xl bg-slate-50/50 space-y-2.5">
                                <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                                    خطوات وآلية تقديم الخدمات للعميل
                                </h4>
                                {isEditingBrief ? (
                                    <textarea
                                        value={editServiceSteps}
                                        onChange={(e) => setEditServiceSteps(e.target.value)}
                                        rows={4}
                                        className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-bold outline-none focus:border-black transition-all"
                                    />
                                ) : (
                                    <p className="text-xs font-bold leading-relaxed text-slate-500 whitespace-pre-line">{briefData.service_steps}</p>
                                )}
                            </div>

                            {/* 4. نقاط قوة الشركة */}
                            <div className="p-5 border border-slate-100 rounded-2xl bg-slate-50/50 space-y-2.5">
                                <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                                    ما هي نقاط قوة الشركة (البشرية والمادية)؟
                                </h4>
                                {isEditingBrief ? (
                                    <textarea
                                        value={editCompanyStrengths}
                                        onChange={(e) => setEditCompanyStrengths(e.target.value)}
                                        rows={4}
                                        className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-bold outline-none focus:border-black transition-all"
                                    />
                                ) : (
                                    <p className="text-xs font-bold leading-relaxed text-slate-500 whitespace-pre-line">{briefData.company_strengths}</p>
                                )}
                            </div>

                            {/* 5. نقاط البيع الحالية */}
                            <div className="p-5 border border-slate-100 rounded-2xl bg-slate-50/50 space-y-2.5 md:col-span-2">
                                <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                                    ما هي نقاط البيع والميزات التنافسية الحالية لديك؟
                                </h4>
                                {isEditingBrief ? (
                                    <textarea
                                        value={editSellingPoints}
                                        onChange={(e) => setEditSellingPoints(e.target.value)}
                                        rows={3}
                                        className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-bold outline-none focus:border-black transition-all"
                                    />
                                ) : (
                                    <p className="text-xs font-bold leading-relaxed text-slate-500 whitespace-pre-line">{briefData.selling_points}</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* التبويب الثاني: المستهدفين والتحديات */}
                    {activeSection === 'challenges' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* 6. المشاكل الحالية بالتسويق */}
                            <div className="p-5 border border-slate-100 rounded-2xl bg-slate-50/50 space-y-2.5">
                                <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                                    ما هي مشكلتك وعقباتك الحالية في التسويق؟
                                </h4>
                                {isEditingBrief ? (
                                    <textarea
                                        value={editMarketingProblems}
                                        onChange={(e) => setEditMarketingProblems(e.target.value)}
                                        rows={5}
                                        className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-bold outline-none focus:border-black transition-all"
                                    />
                                ) : (
                                    <p className="text-xs font-bold leading-relaxed text-slate-500 whitespace-pre-line">{briefData.marketing_problems}</p>
                                )}
                            </div>

                            {/* 7. العميل بالتفصيل */}
                            <div className="p-5 border border-slate-100 rounded-2xl bg-slate-50/50 space-y-2.5">
                                <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                                    من هو عميلك بالتفصيل (شخصية العميل المستهدف)؟
                                </h4>
                                {isEditingBrief ? (
                                    <textarea
                                        value={editTargetClientDetail}
                                        onChange={(e) => setEditTargetClientDetail(e.target.value)}
                                        rows={5}
                                        className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-bold outline-none focus:border-black transition-all"
                                    />
                                ) : (
                                    <p className="text-xs font-bold leading-relaxed text-slate-500 whitespace-pre-line">{briefData.target_client_detail}</p>
                                )}
                            </div>

                            {/* 8. المنافسين أونلاين وأوفلاين (البحث والإدراج الذكي متاح في التعديل) */}
                            <div className="p-5 border border-slate-100 rounded-2xl bg-slate-50/50 space-y-2.5 md:col-span-2">
                                <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                                    من هو المنافس لك في الإنترنت (مع روابط مواقعهم) وفي أرض الواقع؟
                                </h4>
                                {isEditingBrief ? (
                                    <div className="space-y-4">
                                        <textarea
                                            value={editCompetitorsOnlineOffline}
                                            onChange={(e) => setEditCompetitorsOnlineOffline(e.target.value)}
                                            rows={6}
                                            className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-bold outline-none focus:border-black transition-all"
                                            placeholder="اكتب المنافسين هنا، أو استخدم أداة البحث عن المتاجر المكتشفة بالأسفل لإدراجهم فورياً..."
                                        />
                                        
                                        {/* لوحة أداة البحث والإدراج الفوري للمتاجر المكتشفة */}
                                        <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-sm space-y-3">
                                            <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-800">
                                                <Store size={14} className="text-slate-500" />
                                                <span>البحث والإدراج الفوري من المتاجر المكتشفة 🔍 ({discoveredStores.length} متجر متوفر)</span>
                                            </div>
                                            
                                            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                                                {/* مربع نص تصفية المتاجر */}
                                                <div className="sm:col-span-5 relative">
                                                    <input 
                                                        type="text" 
                                                        placeholder="ابحث باسم المتجر أو الرابط..."
                                                        value={leadsSearchText}
                                                        onChange={(e) => setLeadsSearchText(e.target.value)}
                                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pr-8 pl-3 text-[10.5px] font-bold outline-none focus:border-black focus:bg-white transition-all text-slate-800"
                                                    />
                                                    <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
                                                </div>
                                                
                                                {/* قائمة الخيارات المفهرسة والمفلترة */}
                                                <div className="sm:col-span-5">
                                                    <select
                                                        value={selectedLeadId}
                                                        onChange={(e) => setSelectedLeadId(e.target.value)}
                                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-[10.5px] font-bold outline-none focus:border-black focus:bg-white text-slate-800 transition-all cursor-pointer"
                                                    >
                                                        <option value="">-- اختر من قائمة المتاجر ({filteredLeads.length}) --</option>
                                                        {filteredLeads.map(store => (
                                                            <option key={store.id} value={store.id}>
                                                                {store.store_name} ({store.website || store.store_url})
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                                
                                                {/* زر التأكيد والإدراج */}
                                                <div className="sm:col-span-2">
                                                    <button
                                                        type="button"
                                                        onClick={insertDiscoveredLeadAsCompetitor}
                                                        disabled={!selectedLeadId}
                                                        className="w-full py-2 px-3 bg-black hover:bg-zinc-800 text-white disabled:bg-slate-200 disabled:text-slate-400 font-black text-[10px] rounded-xl transition-all shadow-sm flex items-center justify-center gap-1"
                                                    >
                                                        <Plus size={12} />
                                                        <span>إدراج كمنافس</span>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-xs font-bold leading-relaxed text-slate-500 whitespace-pre-line">{briefData.competitors_online_offline}</p>
                                )}
                            </div>

                            {/* 9. التقييد الديني أو السياسي */}
                            <div className="p-5 border border-slate-100 rounded-2xl bg-slate-50/50 space-y-2.5 md:col-span-2">
                                <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                                    هل يوجد أي تقييد فكري، ديني، أو سياسي يجب مراعاته بالرسائل التسويقية؟
                                </h4>
                                {isEditingBrief ? (
                                    <textarea
                                        value={editReligiousPoliticalRestrictions}
                                        onChange={(e) => setEditReligiousPoliticalRestrictions(e.target.value)}
                                        rows={4}
                                        className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-bold outline-none focus:border-black transition-all"
                                    />
                                ) : (
                                    <p className="text-xs font-bold leading-relaxed text-slate-500 whitespace-pre-line">{briefData.religious_political_restrictions}</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* التبويب الثالث: الحملة والرسالة */}
                    {activeSection === 'campaign' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* 10. الهدف الأساسي من التعاقد */}
                            <div className="p-5 border border-slate-100 rounded-2xl bg-slate-50/50 space-y-2.5">
                                <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                                    ما الهدف الأساسي من التعاقد مع م/ أحمد خطاب؟
                                </h4>
                                {isEditingBrief ? (
                                    <textarea
                                        value={editContractGoalKhattab}
                                        onChange={(e) => setEditContractGoalKhattab(e.target.value)}
                                        rows={4}
                                        className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-bold outline-none focus:border-black transition-all"
                                    />
                                ) : (
                                    <p className="text-xs font-bold leading-relaxed text-slate-500 whitespace-pre-line">{briefData.contract_goal_khattab}</p>
                                )}
                            </div>

                            {/* 11. لماذا تحتاج الحملة */}
                            <div className="p-5 border border-slate-100 rounded-2xl bg-slate-50/50 space-y-2.5">
                                <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                                    لماذا تحتاج هذه الحملة الإعلانية حالياً؟
                                </h4>
                                {isEditingBrief ? (
                                    <textarea
                                        value={editCampaignReason}
                                        onChange={(e) => setEditCampaignReason(e.target.value)}
                                        rows={4}
                                        className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-bold outline-none focus:border-black transition-all"
                                    />
                                ) : (
                                    <p className="text-xs font-bold leading-relaxed text-slate-500 whitespace-pre-line">{briefData.campaign_reason}</p>
                                )}
                            </div>

                            {/* 12. الرسالة التي تبعثها */}
                            <div className="p-5 border border-slate-100 rounded-2xl bg-slate-50/50 space-y-2.5">
                                <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                                    ما هي الرسالة التي تبعثها من خلال الحملة؟
                                </h4>
                                {isEditingBrief ? (
                                    <textarea
                                        value={editCampaignMessage}
                                        onChange={(e) => setEditCampaignMessage(e.target.value)}
                                        rows={4}
                                        className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-bold outline-none focus:border-black transition-all"
                                    />
                                ) : (
                                    <p className="text-xs font-bold leading-relaxed text-slate-500 whitespace-pre-line">{briefData.campaign_message}</p>
                                )}
                            </div>

                            {/* 13. ما يفكر ويشعر ويفعله الجمهور */}
                            <div className="p-5 border border-slate-100 rounded-2xl bg-slate-50/50 space-y-2.5">
                                <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                                    ما يجب أن يفكر ويشعر ويفعله الجمهور عند تصفح المتجر؟
                                </h4>
                                {isEditingBrief ? (
                                    <textarea
                                        value={editAudienceThinkFeelDo}
                                        onChange={(e) => setEditAudienceThinkFeelDo(e.target.value)}
                                        rows={4}
                                        className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-bold outline-none focus:border-black transition-all"
                                    />
                                ) : (
                                    <p className="text-xs font-bold leading-relaxed text-slate-500 whitespace-pre-line">{briefData.audience_think_feel_do}</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* التبويب الرابع: الإدارة والتوقعات */}
                    {activeSection === 'management' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* 14. التوقعات الخاصة للحملة */}
                            <div className="p-5 border border-slate-100 rounded-2xl bg-slate-50/50 space-y-2.5">
                                <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                                    ما هي توقعاتكم وأرقامكم المستهدفة للحملة؟
                                </h4>
                                {isEditingBrief ? (
                                    <textarea
                                        value={editCampaignExpectations}
                                        onChange={(e) => setEditCampaignExpectations(e.target.value)}
                                        rows={4}
                                        className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-bold outline-none focus:border-black transition-all"
                                    />
                                ) : (
                                    <p className="text-xs font-bold leading-relaxed text-slate-500 whitespace-pre-line">{briefData.campaign_expectations}</p>
                                )}
                            </div>

                            {/* 15. متى تبدأ النتائج بالظهور */}
                            <div className="p-5 border border-slate-100 rounded-2xl bg-slate-50/50 space-y-2.5">
                                <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                                    ما هو الوقت الذي تتوقعون بدء رؤية النتائج فيه؟
                                </h4>
                                {isEditingBrief ? (
                                    <textarea
                                        value={editResultsTimeframe}
                                        onChange={(e) => setEditResultsTimeframe(e.target.value)}
                                        rows={4}
                                        className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-bold outline-none focus:border-black transition-all"
                                    />
                                ) : (
                                    <p className="text-xs font-bold leading-relaxed text-slate-500 whitespace-pre-line">{briefData.results_timeframe}</p>
                                )}
                            </div>

                            {/* 16. صاحب الكلمة النهائية */}
                            <div className="p-5 border border-slate-100 rounded-2xl bg-slate-50/50 space-y-2.5">
                                <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                                    من هو صاحب القرار النهائي المعتمد بالتعاقد؟
                                </h4>
                                {isEditingBrief ? (
                                    <textarea
                                        value={editFinalDecisionMaker}
                                        onChange={(e) => setEditFinalDecisionMaker(e.target.value)}
                                        rows={4}
                                        className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-bold outline-none focus:border-black transition-all"
                                    />
                                ) : (
                                    <p className="text-xs font-bold leading-relaxed text-slate-500 whitespace-pre-line">{briefData.final_decision_maker}</p>
                                )}
                            </div>

                            {/* 17. مواعيد الاجتماعات والتقارير */}
                            <div className="p-5 border border-slate-100 rounded-2xl bg-slate-50/50 space-y-2.5">
                                <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                                    ما هي مواعيد الاجتماعات ووتيرة تسليم التقارير؟
                                </h4>
                                {isEditingBrief ? (
                                    <textarea
                                        value={editMeetingsReportsSchedule}
                                        onChange={(e) => setEditMeetingsReportsSchedule(e.target.value)}
                                        rows={4}
                                        className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-bold outline-none focus:border-black transition-all"
                                    />
                                ) : (
                                    <p className="text-xs font-bold leading-relaxed text-slate-500 whitespace-pre-line">{briefData.meetings_reports_schedule}</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* كارت ملخص البريف والاتفاق */}
            <div className="bg-white border border-slate-200/80 rounded-[32px] p-6 sm:p-8 shadow-sm space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-black text-white">
                            <BookOpen size={16} />
                        </div>
                        <div>
                            <h4 className="text-sm font-black text-slate-900">ملخص البريف والاتفاق</h4>
                            <p className="text-[10px] text-slate-400 font-bold mt-0.5">خلاصة سريعة ونقاط تركيز أساسية تم التوافق عليها مع العميل</p>
                        </div>
                    </div>
                    
                    <div>
                        {isEditingSummary ? (
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleSaveSummary}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black text-white hover:bg-zinc-800 text-[10px] font-black transition-all shadow-sm"
                                >
                                    <Save size={12} />
                                    <span>حفظ الملخص</span>
                                </button>
                                <button
                                    onClick={() => {
                                        setEditSummary(briefData.summary || '');
                                        setIsEditingSummary(false);
                                    }}
                                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-zinc-200 text-zinc-500 hover:text-black hover:bg-zinc-50 text-[10px] font-black transition-all"
                                >
                                    <X size={12} />
                                    <span>إلغاء</span>
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => {
                                    setEditSummary(briefData.summary || '');
                                    setIsEditingSummary(true);
                                }}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 text-zinc-700 hover:border-black hover:text-black hover:bg-zinc-50 text-[10px] font-black transition-all shadow-sm"
                            >
                                <Edit3 size={12} />
                                <span>تعديل الملخص</span>
                            </button>
                        )}
                    </div>
                </div>

                <div className="pt-1">
                    {isEditingSummary ? (
                        <textarea
                            value={editSummary}
                            onChange={(e) => setEditSummary(e.target.value)}
                            rows={6}
                            placeholder="اكتب هنا الملخص التنفيذي للمشروع وأهم التوصيات المتفق عليها..."
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-bold outline-none focus:border-black focus:bg-white transition-all text-slate-800 leading-relaxed"
                        />
                    ) : (
                        briefData.summary ? (
                            <p className="text-xs font-bold leading-relaxed text-slate-600 whitespace-pre-line text-justify bg-slate-50/40 p-4 border border-slate-100 rounded-2xl">{briefData.summary}</p>
                        ) : (
                            <div className="text-center py-6 border border-dashed border-slate-200 rounded-2xl bg-slate-50/20">
                                <p className="text-[11px] font-bold text-slate-400">لم يتم كتابة ملخص تنفيذي للبريف بعد.</p>
                                <button
                                    onClick={() => {
                                        setEditSummary('');
                                        setIsEditingSummary(true);
                                    }}
                                    className="mt-2 text-[10px] font-black text-black underline hover:text-zinc-700"
                                >
                                    إضافة ملخص الآن ✍️
                                </button>
                            </div>
                        )
                    )}
                </div>
            </div>
        </div>

        {/* الجزء الأيسر: لوحة ألوان الهوية، الخطوط، والروابط المشتركة (4 أعمدة ثنائية التوافق) */}
            <div className="xl:col-span-4 space-y-8">
                
                {/* 1. كارت ألوان الهوية البصرية */}
                <div className="bg-white border border-slate-200/80 rounded-[32px] shadow-sm p-6 space-y-6">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                        <div className="flex items-center gap-2">
                            <div className="p-2 rounded-xl bg-slate-100 text-slate-700">
                                <Palette size={16} />
                            </div>
                            <div>
                                <h4 className="text-xs font-black text-slate-900">ألوان الهوية البصرية</h4>
                                <p className="text-[9px] text-slate-400 font-bold">لوحة ألوان العميل المعتمدة ونسخ كودها بلمسة واحدة</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3.5">
                        {briefData.colors.length === 0 ? (
                            <p className="text-[10px] font-bold text-slate-400 col-span-2 text-center py-4">لم يتم تعيين أي ألوان هاتفية للهوية البصرية بعد</p>
                        ) : (
                            briefData.colors.map((color, index) => (
                                <div 
                                    key={index} 
                                    onClick={() => copyColorToClipboard(color.hex, index)}
                                    className="group border border-slate-100 rounded-2xl p-2.5 flex items-center justify-between hover:border-black/35 hover:bg-slate-50/50 transition-all cursor-pointer relative"
                                    title="انقر لنسخ كود اللون"
                                >
                                    <div className="flex items-center gap-2 truncate">
                                        <div 
                                            className="w-7 h-7 rounded-lg border border-slate-200 flex-shrink-0 shadow-sm"
                                            style={{ backgroundColor: color.hex }}
                                        />
                                        <div className="truncate text-right">
                                            <div className="text-[10px] font-black text-slate-800 truncate">{color.name}</div>
                                            <div className="text-[8px] font-mono text-slate-400 uppercase font-black">{color.hex}</div>
                                        </div>
                                    </div>
                                    <div className="flex-shrink-0 p-1.5 text-slate-400 group-hover:text-black transition-colors">
                                        {copiedColorIndex === index ? (
                                            <Check className="text-emerald-500 animate-pulse" size={12} />
                                        ) : (
                                            <Copy size={11} />
                                        )}
                                    </div>
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteColor(index);
                                        }}
                                        className="absolute -top-1.5 -left-1.5 bg-rose-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-rose-600"
                                        title="حذف هذا اللون"
                                    >
                                        <Trash2 size={9} />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>

                    <form onSubmit={handleAddColor} className="flex gap-2 items-end border-t border-slate-100 pt-4">
                        <div className="flex-1 space-y-1">
                            <label className="text-[8px] font-black text-slate-500">اسم اللون</label>
                            <input 
                                type="text"
                                required
                                placeholder="مثال: اللون الأساسي"
                                value={newColorName}
                                onChange={(e) => setNewColorName(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200/80 rounded-xl py-2 px-2.5 text-[10px] font-bold outline-none focus:border-black focus:bg-white text-slate-800 transition-all placeholder:text-[9px]"
                            />
                        </div>
                        <div className="w-[70px] space-y-1">
                            <label className="text-[8px] font-black text-slate-500">كود اللون</label>
                            <div className="relative">
                                <input 
                                    type="color"
                                    value={newColorHex}
                                    onChange={(e) => setNewColorHex(e.target.value)}
                                    className="absolute right-1 top-1/2 -translate-y-1/2 w-5 h-5 rounded-md border-0 p-0 cursor-pointer overflow-hidden"
                                />
                                <input 
                                    type="text"
                                    required
                                    placeholder="#0F172A"
                                    value={newColorHex}
                                    onChange={(e) => setNewColorHex(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200/80 rounded-xl py-2 pr-7 pl-1 text-[9px] font-mono font-black uppercase text-slate-800 outline-none focus:border-black focus:bg-white transition-all text-left"
                                />
                            </div>
                        </div>
                        <button
                            type="submit"
                            className="bg-black hover:bg-zinc-800 text-white rounded-xl p-2.5 flex items-center justify-center shadow-sm transition-all"
                            title="إضافة لون"
                        >
                            <Plus size={14} />
                        </button>
                    </form>
                </div>

                {/* 2. كارت خطوط الهوية البصرية */}
                <div className="bg-white border border-slate-200/80 rounded-[32px] shadow-sm p-6 space-y-5">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                        <div className="flex items-center gap-2">
                            <div className="p-2 rounded-xl bg-slate-100 text-slate-700">
                                <Type size={16} />
                            </div>
                            <div>
                                <h4 className="text-xs font-black text-slate-900">خطوط الهوية المعتمدة</h4>
                                <p className="text-[9px] text-slate-400 font-bold">الخط الأساسي والفرعي لنصوص ومواقع العميل</p>
                            </div>
                        </div>
                        
                        <button
                            onClick={() => {
                                if (editFontsMode) {
                                    handleSaveFonts();
                                } else {
                                    setEditFontsMode(true);
                                }
                            }}
                            className="text-[10px] font-black text-zinc-500 hover:text-black underline transition-colors"
                        >
                            {editFontsMode ? 'حفظ' : 'تعديل'}
                        </button>
                    </div>

                    {editFontsMode ? (
                        <div className="space-y-3.5">
                            <div className="space-y-1">
                                <label className="text-[8px] font-black text-slate-500">الخط الأساسي (العناوين)</label>
                                <input 
                                    type="text"
                                    value={primaryFont}
                                    onChange={(e) => setPrimaryFont(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200/80 rounded-xl py-2 px-3 text-[10px] font-bold outline-none focus:border-black focus:bg-white text-slate-800"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[8px] font-black text-slate-500">الخط الفرعي (الفقرات)</label>
                                <input 
                                    type="text"
                                    value={secondaryFont}
                                    onChange={(e) => setSecondaryFont(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200/80 rounded-xl py-2 px-3 text-[10px] font-bold outline-none focus:border-black focus:bg-white text-slate-800"
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div className="p-3 border border-slate-100 rounded-2xl bg-slate-50/50 flex justify-between items-center">
                                <div className="text-[10px] font-black text-slate-600">الخط الأساسي (العناوين):</div>
                                <div className="text-xs font-black text-slate-900" style={{ fontFamily: briefData.fonts?.primary || 'Cairo' }}>
                                    {briefData.fonts?.primary || 'Cairo'}
                                </div>
                            </div>
                            <div className="p-3 border border-slate-100 rounded-2xl bg-slate-50/50 flex justify-between items-center">
                                <div className="text-[10px] font-black text-slate-600">الخط الفرعي (الفقرات):</div>
                                <div className="text-xs font-black text-slate-900" style={{ fontFamily: briefData.fonts?.secondary || 'Inter' }}>
                                    {briefData.fonts?.secondary || 'Inter'}
                                </div>
                            </div>

                            <div className="p-4 border border-dashed border-slate-200 rounded-2xl space-y-1.5 text-center bg-slate-50/20">
                                <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest">معاينة حية للمزيج المطبعي</div>
                                <div className="text-base font-black text-slate-800" style={{ fontFamily: briefData.fonts?.primary || 'Cairo' }}>أبجد هوز حطي كلمن</div>
                                <div className="text-[10px] font-bold text-slate-400 leading-relaxed" style={{ fontFamily: briefData.fonts?.secondary || 'Inter' }}>
                                    The quick brown fox jumps over the lazy dog.
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* 3. كارت بنك الملفات والأصول المرجعية */}
                <div className="bg-white border border-slate-200/80 rounded-[32px] shadow-sm p-6 space-y-5">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                        <div className="flex items-center gap-2">
                            <div className="p-2 rounded-xl bg-slate-100 text-slate-700">
                                <Link2 size={16} />
                            </div>
                            <div>
                                <h4 className="text-xs font-black text-slate-900">بنك الأصول والملفات المرجعية</h4>
                                <p className="text-[9px] text-slate-400 font-bold">حفظ روابط مجلدات Drive المخصصة للصور والشعارات وخطة السيو</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {briefData.links.length === 0 ? (
                            <div className="p-6 border border-dashed border-slate-200 rounded-2xl text-center text-slate-400">
                                <Globe className="mx-auto mb-2 text-slate-300" size={20} />
                                <p className="text-[10px] font-bold">لا توجد ملفات مرجعية مسجلة حالياً لسهولة التصفح</p>
                            </div>
                        ) : (
                            briefData.links.map((link) => (
                                <div 
                                    key={link.id} 
                                    className="group border border-slate-100 rounded-2xl p-3 flex items-center justify-between hover:border-black/35 hover:bg-slate-50/50 transition-all"
                                >
                                    <div className="flex items-center gap-2.5 truncate">
                                        <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 flex-shrink-0 group-hover:bg-white transition-colors">
                                            {getLinkIcon(link.type)}
                                        </div>
                                        <div className="truncate text-right">
                                            <div className="text-[10px] font-black text-slate-800 truncate mb-1">{link.name}</div>
                                            <div className="flex items-center gap-1.5">
                                                {getLinkTypeBadge(link.type)}
                                                <a 
                                                    href={link.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-[9px] font-mono text-zinc-400 hover:text-black underline truncate max-w-[120px] direction-ltr inline-block"
                                                >
                                                    {link.url.replace(/^https?:\/\//, '')}
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-1.5 flex-shrink-0">
                                        <a 
                                            href={link.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-1.5 rounded-lg border border-slate-200 hover:border-black hover:bg-white text-slate-500 hover:text-black transition-all"
                                            title="زيارة الرابط"
                                        >
                                            <Globe size={12} />
                                        </a>
                                        <button 
                                            onClick={() => handleDeleteLink(link.id)}
                                            className="p-1.5 rounded-lg border border-slate-200 hover:border-rose-600 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-all"
                                            title="حذف الرابط"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <form onSubmit={handleAddLink} className="border-t border-slate-100 pt-5 space-y-3.5">
                        <div className="text-[10px] font-black text-slate-800">إضافة ملف مرجعي جديد</div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <label className="text-[8px] font-black text-slate-500">اسم الملف / الأصل</label>
                                <input 
                                    type="text"
                                    required
                                    placeholder="مثال: مجلد صور المنتجات"
                                    value={newLinkName}
                                    onChange={(e) => setNewLinkName(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200/80 rounded-xl py-2.5 px-3 text-[10px] font-bold outline-none focus:border-black focus:bg-white text-slate-800 transition-all"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[8px] font-black text-slate-500">نوع الملف</label>
                                <select 
                                    value={newLinkType}
                                    onChange={(e) => setNewLinkType(e.target.value as any)}
                                    className="w-full bg-slate-50 border border-slate-200/80 rounded-xl py-2.5 px-3 text-[10px] font-bold outline-none focus:border-black focus:bg-white text-slate-800 transition-all"
                                >
                                    <option value="drive">مجلد Drive المشترك</option>
                                    <option value="content_plan">خطة المحتوى والسيو</option>
                                    <option value="logo">شعار العلامة التجارية</option>
                                    <option value="guideline">دليل الهوية البصرية</option>
                                    <option value="other">رابط آخر</option>
                                </select>
                            </div>
                        </div>
                        
                        <div className="space-y-1">
                            <label className="text-[8px] font-black text-slate-500">رابط الملف (URL)</label>
                            <input 
                                type="text"
                                required
                                placeholder="مثال: drive.google.com/drive/folders/..."
                                value={newLinkUrl}
                                onChange={(e) => setNewLinkUrl(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200/80 rounded-xl py-2.5 px-3 text-[10px] font-bold outline-none focus:border-black focus:bg-white text-slate-800 transition-all text-left direction-ltr"
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full py-2.5 px-4 rounded-xl bg-black hover:bg-zinc-800 text-white font-black text-[10px] transition-all shadow-sm flex items-center justify-center gap-1.5"
                        >
                            <Plus size={14} />
                            <span>تأكيد وإضافة الأصل المرجعي</span>
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
