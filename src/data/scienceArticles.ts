// ============================================
// 营养科学文章库
// 内容来源：PREDIMED 试验、NOVA 分类系统、AHA/WHO 指南、
//           Sonnenburg Lab、NEJM/Lancet 等权威文献
// ============================================

export interface ScienceArticle {
  id: string;
  tag: string;
  tagEn: string;
  title: { zh: string; en: string };
  summary: { zh: string; en: string };
  body: { zh: string; en: string }[];  // 段落数组
  source: string;  // 主要参考来源
  readMinutes: number;
}

export const SCIENCE_ARTICLES: ScienceArticle[] = [
  {
    id: 'mediterranean-diet',
    tag: '地中海饮食',
    tagEn: 'Mediterranean Diet',
    title: {
      zh: '地中海饮食：目前证据最强的抗衰老饮食模式',
      en: 'Mediterranean Diet: The Best-Evidenced Anti-Aging Eating Pattern',
    },
    summary: {
      zh: 'PREDIMED 大型随机对照试验证明，坚持地中海饮食可将主要心血管事件风险降低 30%。其核心不是单一营养素，而是食物组合的协同效应。',
      en: 'The landmark PREDIMED randomized trial showed that a Mediterranean diet reduces major cardiovascular events by 30%. The secret lies not in single nutrients, but in the synergy of whole food combinations.',
    },
    body: [
      {
        zh: '**什么是地中海饮食？**\n\n地中海饮食起源于20世纪50年代对地中海地区居民饮食习惯的观察。它以大量蔬菜、水果、全谷物、豆类、坚果和橄榄油为基础，适量摄入鱼类和发酵乳制品，减少红肉和加工食品。',
        en: '**What Is the Mediterranean Diet?**\n\nThe Mediterranean diet emerged from 1950s observations of dietary habits in Mediterranean populations. It is built on abundant vegetables, fruits, whole grains, legumes, nuts, and olive oil, with moderate fish and fermented dairy, and limited red meat and processed foods.',
      },
      {
        zh: '**关键证据：PREDIMED 试验**\n\n西班牙进行的 PREDIMED（通过地中海饮食预防心血管疾病）试验追踪了超过 7,400 名高风险受试者。结果显示，补充特级初榨橄榄油或坚果的地中海饮食组，与低脂对照组相比，主要心血管事件（心肌梗死、脑卒中、心血管死亡）风险下降约 30%。',
        en: '**Key Evidence: The PREDIMED Trial**\n\nThe PREDIMED (Prevención con Dieta Mediterránea) trial in Spain followed over 7,400 high-risk participants. Those on a Mediterranean diet supplemented with extra-virgin olive oil or nuts showed ~30% fewer major cardiovascular events (heart attack, stroke, cardiovascular death) compared to a low-fat control diet.',
      },
      {
        zh: '**为什么有效？多机制协同**\n\n地中海饮食的保护效应来自多个机制同时作用：橄榄油中的油酸和多酚抑制 NF-κB 炎症通路；鱼类中的 EPA/DHA 降低甘油三酯；蔬菜水果中的多酚提升 HDL 功能；全谷物和豆类的纤维喂养产生丁酸的肠道菌群，进一步抑制系统性炎症。',
        en: '**Why It Works: Multi-Mechanism Synergy**\n\nProtective effects come from multiple simultaneous mechanisms: oleic acid and polyphenols in olive oil suppress the NF-κB inflammatory pathway; EPA/DHA from fish lower triglycerides; vegetable and fruit polyphenols improve HDL function; fiber from whole grains and legumes feeds butyrate-producing gut bacteria, further suppressing systemic inflammation.',
      },
      {
        zh: '**实践要点**\n\n每天摄入 5 份以上蔬果（颜色越多越好）；用特级初榨橄榄油替代其他植物油；每周至少吃 2 次富含 omega-3 的鱼（三文鱼、沙丁鱼、鲭鱼）；每天一把混合坚果；用全谷物替代精制谷物；用豆类部分替代红肉。\n\n重要的是，这是一种整体饮食模式，偶尔吃一两样"不完美"的食物不会破坏整体效果。',
        en: '**Practical Takeaways**\n\nAim for 5+ servings of varied-color fruits and vegetables daily; replace other oils with extra-virgin olive oil; eat omega-3-rich fish at least twice a week (salmon, sardines, mackerel); have a daily handful of mixed nuts; choose whole grains over refined; substitute legumes for some red meat.\n\nImportantly, this is a whole dietary pattern — occasional "imperfect" meals don\'t undermine the overall benefit.',
      },
    ],
    source: 'Estruch R. et al., NEJM 2013; PREDIMED-Plus 2020',
    readMinutes: 4,
  },
  {
    id: 'ultra-processed-inflammation',
    tag: '超加工食品',
    tagEn: 'Ultra-Processed Foods',
    title: {
      zh: '超加工食品如何悄悄点燃你体内的炎症之火',
      en: 'How Ultra-Processed Foods Silently Ignite Inflammation',
    },
    summary: {
      zh: '基于 NOVA 分类系统的大规模队列研究显示，超加工食品每增加 10% 的摄入比例，全因死亡率上升 14%，炎症标志物显著升高。问题不只是热量，而是食品工业化加工本身。',
      en: 'Large cohort studies using the NOVA classification found that each 10% increase in ultra-processed food consumption raises all-cause mortality by 14% and significantly elevates inflammatory markers. The problem isn\'t just calories — it\'s industrial processing itself.',
    },
    body: [
      {
        zh: '**NOVA 分类：超加工食品的定义**\n\n巴西圣保罗大学 Monteiro 教授团队提出的 NOVA 系统将食物分为四类，第四类即"超加工食品"——由工业提取的成分（氢化油、变性淀粉、蛋白质水解物、高果糖玉米糖浆）组合而成，并添加多种食品添加剂（乳化剂、增味剂、人工色素）来模拟真实食物的口感和外观。',
        en: '**NOVA Classification: Defining Ultra-Processed Foods**\n\nBrazilian researcher Carlos Monteiro\'s NOVA system divides foods into four groups. Group 4 — ultra-processed foods — are assembled from industrially extracted ingredients (hydrogenated oils, modified starches, protein hydrolysates, high-fructose corn syrup) plus multiple additives (emulsifiers, flavor enhancers, artificial colors) engineered to mimic real food.',
      },
      {
        zh: '**关键研究数据**\n\n法国 NutriNet-Santé 队列研究（超过 10 万名参与者）发现，超加工食品摄入量最高的人群患癌症风险增加 23%。另一项发表于《BMJ》的研究追踪 44,000 名法国成人，发现超加工食品每增加 10 个百分点，全因死亡率上升 14%。美国 NIH-AARP 饮食健康研究也显示，高超加工食品摄入与抑郁症风险正相关。',
        en: '**Key Research Data**\n\nThe French NutriNet-Santé cohort (100,000+ participants) found 23% higher cancer risk in the highest ultra-processed food consumers. A BMJ study of 44,000 French adults found each 10-percentage-point increase in ultra-processed food intake raised all-cause mortality by 14%. The NIH-AARP Diet and Health Study also linked high UPF consumption to increased depression risk.',
      },
      {
        zh: '**机制：不仅仅是营养成分**\n\n超加工食品引发炎症的机制是多重的。乳化剂（卵磷脂、羧甲基纤维素等）直接破坏肠道黏液层，增加肠道通透性，导致内毒素（LPS）进入血液引发慢性炎症。高果糖玉米糖浆绕过饱腹感调节，直接在肝脏转化为脂肪。超加工食品通常低膳食纤维，减少产丁酸菌的食物来源，肠道屏障修复减弱。',
        en: '**Mechanisms Beyond Nutrients**\n\nUPFs drive inflammation through multiple pathways. Emulsifiers (like carboxymethylcellulose) directly degrade the gut mucus layer, increasing intestinal permeability and allowing LPS endotoxin to enter the bloodstream and trigger chronic inflammation. High-fructose corn syrup bypasses satiety regulation and is directly converted to fat in the liver. Low fiber in UPFs starves butyrate-producing gut bacteria, weakening gut barrier repair.',
      },
      {
        zh: '**识别超加工食品**\n\n简单判断法：看配料表——若含有氢化植物油、变性淀粉、各种"素"（乳化剂代码 E×××）、人工香精、亚硝酸盐，基本即为超加工食品。常见品类：方便面、薯片、火腿肠、甜甜圈、含糖饮料、大多数早餐麦片。\n\n替代策略：用天然坚果代替薯片；用鸡蛋/豆腐代替火腿肠；用燕麦代替早餐麦片；用气泡水代替碳酸饮料。',
        en: '**Identifying Ultra-Processed Foods**\n\nA quick test: read the ingredient list — if it contains hydrogenated oils, modified starches, emulsifier codes (E×××), artificial flavors, or nitrites, it\'s likely ultra-processed. Common examples: instant noodles, chips, processed sausage, donuts, sugary drinks, most breakfast cereals.\n\nSubstitution strategy: swap chips for natural nuts; processed sausage for eggs/tofu; sweetened cereal for oats; soda for sparkling water.',
      },
    ],
    source: 'Monteiro CA. et al., Public Health Nutr 2019; Schnabel L. et al., JAMA 2019',
    readMinutes: 4,
  },
  {
    id: 'omega3-anti-inflammatory',
    tag: '抗炎营养',
    tagEn: 'Anti-Inflammatory',
    title: {
      zh: 'Omega-3 脂肪酸：天然抗炎药的科学机制',
      en: 'Omega-3 Fatty Acids: The Science Behind Nature\'s Anti-Inflammatory',
    },
    summary: {
      zh: 'EPA 和 DHA 是目前证据最充分的天然抗炎营养素。它们不只是被动地"减少炎症"，而是主动生成消退素（resolvins）和保护素（protectins），促进炎症的主动消退。',
      en: 'EPA and DHA are the best-evidenced natural anti-inflammatory nutrients. They don\'t merely reduce inflammation passively — they actively generate resolvins and protectins that promote active inflammation resolution.',
    },
    body: [
      {
        zh: '**两类 Omega-3：植物来源 vs 海洋来源**\n\nOmega-3 有三种主要形式：ALA（α-亚麻酸，来自亚麻籽、核桃）、EPA（二十碳五烯酸）、DHA（二十二碳六烯酸）。EPA 和 DHA 主要来源于深海冷水鱼，是生物活性最强的形式。ALA 在人体内转化为 EPA/DHA 的效率极低（<5%），因此直接摄入富含 EPA/DHA 的鱼类或藻油更为关键。',
        en: '**Two Types of Omega-3: Plant vs Marine**\n\nOmega-3 comes in three main forms: ALA (α-linolenic acid, from flaxseed and walnuts), EPA (eicosapentaenoic acid), and DHA (docosahexaenoic acid). EPA and DHA primarily come from cold-water fatty fish and are the most biologically active forms. Human conversion of ALA to EPA/DHA is extremely inefficient (<5%), making direct consumption of fatty fish or algae oil critical.',
      },
      {
        zh: '**抗炎机制：从竞争到主动消退**\n\nEPA 和 DHA 通过两条平行机制发挥抗炎作用。第一，竞争性抑制：在细胞膜磷脂中取代花生四烯酸（AA），减少促炎前列腺素和白三烯的合成。第二，主动消退：EPA 生成 E 系消退素（resolvins），DHA 生成 D 系消退素和保护素（protectins/neuroprotectins），这些脂质介质主动招募巨噬细胞清除炎症碎片、终止炎症信号，是一种主动的"灭火"而非简单的"压制"。',
        en: '**Anti-Inflammatory Mechanisms: Competitive Inhibition to Active Resolution**\n\nEPA and DHA act through two parallel mechanisms. First, competitive inhibition: they displace arachidonic acid (AA) in cell membrane phospholipids, reducing synthesis of pro-inflammatory prostaglandins and leukotrienes. Second, active resolution: EPA generates E-series resolvins; DHA generates D-series resolvins and protectins/neuroprotectins — lipid mediators that actively recruit macrophages to clear inflammatory debris and terminate inflammatory signals, a true "fire extinguishing" rather than mere suppression.',
      },
      {
        zh: '**临床证据**\n\nGISSI-Prevenzione 试验追踪了 11,000 名心肌梗死幸存者，显示 omega-3 补充使心血管死亡率下降 30%。多项 meta 分析显示，每周吃 2 次以上富含脂肪的鱼，冠心病死亡风险降低约 36%（AHA 数据）。针对炎症标志物的研究显示，每日补充 2-4g EPA+DHA 可使 CRP（C 反应蛋白）和 IL-6 显著下降。',
        en: '**Clinical Evidence**\n\nThe GISSI-Prevenzione trial of 11,000 heart attack survivors showed omega-3 supplementation reduced cardiovascular mortality by 30%. Multiple meta-analyses show eating fatty fish twice or more weekly reduces coronary heart disease mortality by ~36% (AHA data). Studies on inflammatory markers show daily supplementation with 2–4g EPA+DHA significantly lowers CRP (C-reactive protein) and IL-6.',
      },
      {
        zh: '**食物来源与实践**\n\n最优来源（EPA+DHA 含量/100g）：大西洋三文鱼 2.5g、鲭鱼 2.3g、沙丁鱼 1.5g、金枪鱼（罐头）0.3-1g。目标：每周至少 2 次，每次约 150g 富含脂肪的鱼类。如果不常吃鱼，可考虑藻油补充剂（纯素来源，效果等同鱼油）。\n\n注意：omega-6（葵花油、玉米油）与 omega-3 竞争同样的代谢酶，减少精制植物油的使用与增加 omega-3 同样重要。',
        en: '**Food Sources and Practice**\n\nTop sources (EPA+DHA per 100g): Atlantic salmon 2.5g, mackerel 2.3g, sardines 1.5g, canned tuna 0.3–1g. Target: at least 2 servings of fatty fish per week, ~150g each. For non-fish-eaters, algae oil supplements provide a vegan source equivalent to fish oil.\n\nNote: omega-6 (sunflower oil, corn oil) competes with omega-3 for the same metabolic enzymes — reducing refined vegetable oils is as important as increasing omega-3 intake.',
      },
    ],
    source: 'Marchioli R. et al., Lancet 2002 (GISSI); Serhan CN. et al., Nature Rev Immunol 2014',
    readMinutes: 5,
  },
  {
    id: 'gut-microbiome-fermented',
    tag: '肠道健康',
    tagEn: 'Gut Health',
    title: {
      zh: '肠道菌群与发酵食品：重塑免疫系统的隐藏钥匙',
      en: 'Gut Microbiome & Fermented Foods: The Hidden Key to Immune Reprogramming',
    },
    summary: {
      zh: '斯坦福大学 Sonnenburg 实验室 2021 年发表在《Cell》的研究证明：每天摄入发酵食品 10 周，可使肠道菌群多样性显著提升，19 种炎症蛋白标志物显著下降——效果优于高膳食纤维干预。',
      en: 'A 2021 Stanford Sonnenburg lab study published in Cell demonstrated: 10 weeks of daily fermented food intake significantly increased gut microbiome diversity and decreased 19 inflammatory protein markers — outperforming a high-fiber intervention.',
    },
    body: [
      {
        zh: '**肠道菌群：被忽视的"器官"**\n\n人体肠道中栖居着约 38 万亿个微生物，基因组总量是人体基因组的 150 倍。这个"肠道菌群"不是简单的消化助手，而是与免疫系统深度整合的协同器官：约 70% 的免疫细胞位于肠道黏膜附近，肠道菌群通过代谢产物（短链脂肪酸、胆汁酸、神经递质前体等）持续调节免疫平衡。',
        en: '**The Gut Microbiome: An Overlooked Organ**\n\nThe human gut harbors approximately 38 trillion microorganisms with a combined genome 150× larger than the human genome. This "gut microbiome" is not merely a digestive aid — it\'s a co-regulatory organ deeply integrated with the immune system: ~70% of immune cells reside near the gut mucosa, and gut microbes continuously modulate immune balance through metabolites (short-chain fatty acids, bile acids, neurotransmitter precursors).',
      },
      {
        zh: '**Sonnenburg 实验室的突破性研究**\n\n2021 年发表于《Cell》的随机对照试验将参与者分为两组：一组增加发酵食品摄入（酸奶、开菲尔、发酵奶酪、泡菜、康普茶等），一组增加高膳食纤维摄入。10 周后，发酵食品组肠道菌群多样性显著提升（Shannon 指数上升），并有 19 种炎症细胞因子（包括 IL-17A、IFN-γ、IL-6）显著下降。高纤维组虽然也有改善，但炎症降低幅度小于发酵食品组，且效果与个体原有菌群多样性密切相关。',
        en: '**The Sonnenburg Lab Breakthrough**\n\nA 2021 Cell randomized controlled trial split participants into two groups: increased fermented food intake (yogurt, kefir, fermented cheese, kimchi, kombucha) vs increased high-fiber intake. After 10 weeks, the fermented food group showed significantly increased gut microbiome diversity (higher Shannon index) and significant decreases in 19 inflammatory cytokines including IL-17A, IFN-γ, and IL-6. The high-fiber group also improved, but showed smaller inflammation reductions, and results were strongly dependent on existing microbiome diversity.',
      },
      {
        zh: '**短链脂肪酸：菌群与免疫的信使**\n\n益生菌发酵膳食纤维产生的短链脂肪酸（SCFA）——丁酸、丙酸、乙酸——是沟通肠道菌群与免疫系统的关键信使。丁酸是结肠细胞的主要能量来源，维持肠道黏液层完整性；丙酸在肝脏抑制糖异生；乙酸调节脂肪代谢。三者均能激活 GPR41/GPR43 受体，向免疫细胞发出抗炎信号。',
        en: '**Short-Chain Fatty Acids: Messengers Between Microbiome and Immunity**\n\nShort-chain fatty acids (SCFAs) — butyrate, propionate, acetate — produced by probiotic fermentation of dietary fiber are key messengers between the gut microbiome and the immune system. Butyrate is the primary energy source for colonocytes and maintains gut mucus layer integrity; propionate inhibits hepatic gluconeogenesis; acetate regulates fat metabolism. All three activate GPR41/GPR43 receptors to send anti-inflammatory signals to immune cells.',
      },
      {
        zh: '**如何获得多样化的发酵食品**\n\n不同发酵食品含有不同菌株，多样化摄入比单一来源更好。实用建议：早餐配希腊酸奶（不加糖）；午餐加一小碟泡菜或韩国泡菜；晚餐用味噌做汤底（出锅前加入，避免高温杀菌）；偶尔喝一杯开菲尔或康普茶；纳豆是菌群多样性最高的发酵食品之一，每次 50g 即可（含维生素 K2，额外保护骨骼和血管）。',
        en: '**How to Get Diverse Fermented Foods**\n\nDifferent fermented foods contain different strains — diversity of sources is better than relying on one. Practical suggestions: Greek yogurt (unsweetened) at breakfast; a small portion of kimchi or sauerkraut at lunch; miso-based soup at dinner (add miso after cooking to preserve live cultures); occasional kefir or kombucha; natto is among the highest-diversity fermented foods (~50g per serving, plus vitamin K2 for bone and vascular protection).',
      },
    ],
    source: 'Wastyk HC. et al., Cell 2021; Sonnenburg JL & Bäckhed F, Nature 2016',
    readMinutes: 5,
  },
  {
    id: 'whole-grains-metabolic',
    tag: '代谢健康',
    tagEn: 'Metabolic Health',
    title: {
      zh: '全谷物 vs 精制谷物：同样是主食，差距有多大？',
      en: 'Whole Grains vs Refined Grains: How Big Is the Difference?',
    },
    summary: {
      zh: 'Lancet 公共卫生发表的全球疾病负担研究显示，膳食纤维摄入不足是全球第三大饮食相关死亡风险因素。用全谷物替代精制谷物，可使 2 型糖尿病风险降低 26%、心血管疾病风险降低 21%。',
      en: 'The Global Burden of Disease study in Lancet Public Health found low dietary fiber intake is the third largest diet-related mortality risk factor globally. Replacing refined grains with whole grains reduces type 2 diabetes risk by 26% and cardiovascular risk by 21%.',
    },
    body: [
      {
        zh: '**全谷物与精制谷物的本质差异**\n\n全谷物保留了谷粒的三个部分：麸皮（富含纤维、B 族维生素、矿物质、植酸）、胚芽（富含维生素 E、omega-3、植化素）、胚乳（主要是淀粉）。精制谷物在加工中去除了麸皮和胚芽，损失了约 75% 的纤维、B 族维生素和矿物质，只剩下高度消化的淀粉。',
        en: '**The Essential Difference**\n\nWhole grains retain all three parts of the kernel: bran (fiber, B vitamins, minerals, phytic acid), germ (vitamin E, omega-3, phytonutrients), and endosperm (mainly starch). Refined grains remove bran and germ during processing, losing ~75% of fiber, B vitamins, and minerals — leaving only highly digestible starch.',
      },
      {
        zh: '**血糖动力学：为什么全谷物更好**\n\n相同热量的白米饭和糙米饭在消化速度上差异显著。白米饭的淀粉几乎全部快速水解，造成餐后血糖峰值高且持续时间短，随后血糖快速下降引发饥饿感。糙米中的膳食纤维和植化素减缓淀粉酶活性，延长消化时间，血糖平稳上升后缓慢下降，饱腹感持续更久。长期来看，这种餐餐微小的差异累积成对胰岛功能、胰岛素敏感性和脂肪代谢的深远影响。',
        en: '**Blood Sugar Dynamics: Why Whole Grains Win**\n\nEqual-calorie servings of white and brown rice differ dramatically in digestion speed. White rice starch is almost entirely rapidly hydrolyzed, producing a high but short postprandial glucose peak, followed by a rapid drop that triggers hunger. Brown rice fiber and phytonutrients slow amylase activity, extend digestion, and produce a gradual glucose rise and slow decline — sustaining satiety longer. Over time, these small meal-by-meal differences accumulate into profound impacts on beta-cell function, insulin sensitivity, and fat metabolism.',
      },
      {
        zh: '**β-葡聚糖：燕麦的独特力量**\n\n燕麦中的可溶性纤维 β-葡聚糖是目前食品中功效最明确的降胆固醇成分之一。它在肠道中形成黏稠凝胶，吸附胆汁酸并随粪便排出，强迫肝脏从血液中提取更多胆固醇来重新合成胆汁酸，从而降低 LDL 胆固醇。欧洲食品安全局（EFSA）批准的健康声明：每日摄入 3g β-葡聚糖（约一碗燕麦粥）可降低心脏病风险。',
        en: '**β-Glucan: Oat\'s Unique Power**\n\nOat soluble fiber β-glucan is one of the most evidence-backed cholesterol-lowering food components. It forms a viscous gel in the intestine, binding bile acids for fecal excretion and forcing the liver to extract more cholesterol from blood to re-synthesize bile acids, thereby lowering LDL cholesterol. The European Food Safety Authority (EFSA) has approved the health claim: 3g β-glucan daily (~one bowl of oatmeal) reduces heart disease risk.',
      },
      {
        zh: '**实践指南**\n\n每日全谷物目标：50-150g（干重）。最简单的行动：把白米换成糙米（或 1/3 糙米混 2/3 白米）；早餐吃燕麦而非早餐麦片；用全麦面包替代普通白面包（看配料表确认全麦粉是第一位成分）。藜麦是完整氨基酸来源，适合作为沙拉或杂粮饭的基础。\n\n注意：超市中许多标榜"全麦"的产品实际上全麦粉占比很低，购买时注意查看配料表。',
        en: '**Practical Guide**\n\nDaily whole grain target: 50–150g (dry weight). Easiest actions: replace white with brown rice (or a 1/3 brown + 2/3 white blend); eat oats instead of sweetened breakfast cereal; choose whole wheat bread (check that whole wheat flour is the first ingredient). Quinoa provides complete amino acids and works well as a salad base or mixed-grain rice.\n\nNote: many supermarket products marketed as "whole grain" contain very little whole grain flour — always check the ingredient list.',
      },
    ],
    source: 'Aune D. et al., BMJ 2016; Reynolds A. et al., Lancet 2019',
    readMinutes: 4,
  },
  {
    id: 'plant-diversity-immunity',
    tag: '植物多样性',
    tagEn: 'Plant Diversity',
    title: {
      zh: '每周吃 30 种植物：多样性才是关键',
      en: 'Eat 30 Plant Foods a Week: Diversity Is the Real Goal',
    },
    summary: {
      zh: '美国肠道项目（American Gut Project）对 1 万名参与者的分析发现，每周摄入 30 种以上不同植物的人，肠道菌群多样性远高于每周仅摄入 10 种以下的人，且炎症水平更低、代谢标志物更健康。',
      en: 'The American Gut Project analysis of 10,000 participants found that people eating 30+ different plant foods per week had far greater gut microbiome diversity than those eating fewer than 10, with lower inflammation and healthier metabolic markers.',
    },
    body: [
      {
        zh: '**为什么是 30 种？**\n\n每种植物含有独特的多酚、纤维类型和植化素组合，可喂养不同的肠道菌种。菌群多样性是肠道健康最重要的单一指标——就像生态系统的物种多样性，越丰富越稳定、越有抵御力。30 这个数字来自美国肠道项目：当参与者每周摄入的植物种类超过 30 种时，其 Prevotella、Bifidobacterium 等有益菌的丰度出现质的飞跃。',
        en: '**Why 30?**\n\nEach plant contains a unique combination of polyphenols, fiber types, and phytonutrients that feeds different gut species. Microbiome diversity is the single most important indicator of gut health — like biodiversity in an ecosystem, greater richness means greater stability and resilience. The 30-food benchmark comes from the American Gut Project: when participants consumed more than 30 different plant foods weekly, the abundance of beneficial bacteria like Prevotella and Bifidobacterium increased dramatically.',
      },
      {
        zh: '**"植物"的定义比你想象的更广**\n\n30 种植物包括：蔬菜（每种算一种）、水果（每种算一种）、全谷物（燕麦、糙米、藜麦各算一种）、豆类（黑豆、红豆、鹰嘴豆各算一种）、坚果和种子（核桃、杏仁、亚麻籽各算一种）、香草和香料（也算！姜、蒜、肉桂、姜黄各算一种）。香料的多酚浓度极高，每天加入烹饪中是轻松多样化的方式。',
        en: '**"Plants" Is Broader Than You Think**\n\n30 plant foods include: vegetables (each variety counts), fruits (each variety counts), whole grains (oats, brown rice, quinoa each count), legumes (black beans, red beans, chickpeas each count), nuts and seeds (walnuts, almonds, flaxseed each count), and herbs and spices (yes — ginger, garlic, cinnamon, turmeric each count). Spices have extremely high polyphenol concentrations — adding variety to daily cooking is an easy way to diversify.',
      },
      {
        zh: '**彩虹饮食法：颜色即多样性**\n\n植物的颜色是多酚类型的天然指示器：红色（番茄红素、花青素）——番茄、草莓、红椒；橙/黄色（β-胡萝卜素、玉米黄素）——胡萝卜、南瓜、柑橘；绿色（叶绿素、叶黄素、吲哚）——西兰花、菠菜、抹茶；蓝/紫色（花青素）——蓝莓、紫甘蓝、茄子；白/棕色（异硫氰酸酯、蒜素）——蒜、洋葱、蘑菇。每天确保盘子里有 3-5 种颜色，是实现多样性的最直观方法。',
        en: '**Rainbow Eating: Color as Diversity**\n\nPlant colors are natural indicators of polyphenol type: Red (lycopene, anthocyanins) — tomatoes, strawberries, red pepper; Orange/Yellow (β-carotene, zeaxanthin) — carrots, pumpkin, citrus; Green (chlorophyll, lutein, indoles) — broccoli, spinach, matcha; Blue/Purple (anthocyanins) — blueberries, purple cabbage, eggplant; White/Brown (isothiocyanates, allicin) — garlic, onion, mushrooms. Ensuring 3–5 colors on your plate each day is the most intuitive way to achieve diversity.',
      },
      {
        zh: '**实践：一周 30 种植物挑战**\n\n这听起来很多，但实际上相对容易实现。一碗杂粮饭（糙米+小米+黑米）= 3 种；一个蔬菜沙拉（生菜+番茄+黄瓜+胡萝卜+鹰嘴豆）= 5 种；一把混合坚果（核桃+杏仁+腰果）= 3 种；一碗水果（苹果+蓝莓+草莓）= 3 种；调味料（蒜+姜+葱+黑胡椒）= 4 种。仅上述就达到 18 种，加上一周其他几顿饭轻松超过 30 种。',
        en: '**Practice: The 30-Plant-Foods-a-Week Challenge**\n\nThis sounds like a lot but is actually achievable. A bowl of mixed-grain rice (brown rice + millet + black rice) = 3 plants; a veggie salad (lettuce + tomato + cucumber + carrot + chickpeas) = 5 plants; a handful of mixed nuts (walnuts + almonds + cashews) = 3 plants; a fruit bowl (apple + blueberries + strawberries) = 3 plants; seasonings (garlic + ginger + scallion + black pepper) = 4 plants. That\'s already 18 — add a few more across the week and 30 is easy.',
      },
    ],
    source: 'McDonald D. et al., mSystems 2018 (American Gut Project); Dahl WJ & Stewart ML, Adv Nutr 2015',
    readMinutes: 4,
  },
];
