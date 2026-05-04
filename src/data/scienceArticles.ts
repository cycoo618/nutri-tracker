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
  body: { zh: string; en: string }[];  // 段落数组，支持 **粗体** 和 • 列表
  source: string;
  readMinutes: number;
}

export const SCIENCE_ARTICLES: ScienceArticle[] = [
  {
    id: 'mediterranean-diet',
    tag: '地中海饮食',
    tagEn: 'Mediterranean Diet',
    title: {
      zh: '地中海饮食：一个改变了营养学认知的大型试验',
      en: 'The Mediterranean Diet: The Trial That Changed Nutrition Science',
    },
    summary: {
      zh: '西班牙科学家追踪了 7,400 人长达 5 年，发现坚持地中海饮食可以让心脏病发作的风险降低 30%。最神奇的是，他们不需要减少吃多少——只需要改变吃什么。',
      en: 'Spanish scientists tracked 7,400 people for 5 years and found that a Mediterranean diet cuts heart attack risk by 30%. The remarkable part: participants didn\'t eat less — they just ate differently.',
    },
    body: [
      {
        zh: '**先说一个让研究者自己都震惊的结果**\n\n2013 年，一项叫 PREDIMED 的大型临床试验在西班牙完成。超过 7,400 名心血管高风险的中老年人被随机分成三组：一组吃地中海饮食加额外橄榄油，一组吃地中海饮食加坚果，一组按低脂饮食建议控制饮食。\n\n试验原定跑 6 年，结果 5 年就提前终止了——因为地中海饮食组的效果太明显，继续让对照组吃低脂饮食在伦理上说不过去了。',
        en: '**A result that surprised even the researchers**\n\nIn 2013, a major clinical trial called PREDIMED completed in Spain. Over 7,400 middle-aged and older adults at high cardiovascular risk were randomly split into three groups: Mediterranean diet with extra olive oil, Mediterranean diet with nuts, or a standard low-fat diet.\n\nThe trial was planned to run 6 years but was stopped after 5 — because the Mediterranean diet results were so clear that it was considered unethical to keep the control group on a low-fat diet.',
      },
      {
        zh: '**地中海饮食到底是什么？**\n\n它不是一个严格的食谱，更像是一种饮食风格。核心原则很简单：\n\n• 每天大量吃：蔬菜、水果、全谷物、豆类、坚果\n• 烹饪用油：橄榄油为主（特级初榨最好）\n• 每周至少 2 次：鱼或海鲜\n• 适量：鸡蛋、酸奶、奶酪\n• 少吃：红肉、加工肉类、甜食\n• 几乎不碰：超加工食品、含糖饮料',
        en: '**What actually is the Mediterranean diet?**\n\nIt\'s not a strict meal plan — more of an eating style. The core principles are simple:\n\n• Daily abundance: vegetables, fruit, whole grains, legumes, nuts\n• Cooking fat: olive oil (extra-virgin is best)\n• At least twice a week: fish or seafood\n• In moderation: eggs, yogurt, cheese\n• Less often: red meat, processed meat, sweets\n• Almost never: ultra-processed foods, sugary drinks',
      },
      {
        zh: '**为什么这么吃能降低心脏病风险？**\n\n这不是靠单一营养素的神奇效果，而是一堆食物同时发力：\n\n• 橄榄油里的多酚和油酸，直接压制炎症信号（NF-κB 通路）\n• 鱼类的 Omega-3，让血管更灵活，甘油三酯下降\n• 蔬菜水果的各种抗氧化物，保护血管内皮不被氧化损伤\n• 豆类和全谷物的纤维，喂养肠道益生菌，减少系统性炎症\n\n这些效果加在一起，比任何单一保健品都有效。',
        en: '**Why does eating this way lower heart disease risk?**\n\nIt\'s not one magic nutrient — it\'s many foods working together:\n\n• Polyphenols and oleic acid in olive oil directly suppress inflammation (NF-κB pathway)\n• Omega-3 from fish makes blood vessels more flexible and lowers triglycerides\n• Antioxidants from vegetables and fruit protect the vascular endothelium from oxidative damage\n• Fiber from legumes and whole grains feeds gut bacteria, reducing systemic inflammation\n\nCombined, these effects outperform any single supplement.',
      },
      {
        zh: '**最实用的几个改变**\n\n你不需要一夜之间改变所有饮食习惯。以下几个改变，科学证据最扎实，也最容易做到：\n\n• 把精炼植物油换成特级初榨橄榄油（最简单但影响最大的一步）\n• 每周安排 2 次鱼（三文鱼、沙丁鱼、鲭鱼 Omega-3 最多）\n• 每天来一把混合坚果（核桃 + 杏仁，约 30g）\n• 午餐或晚餐的盘子里，蔬菜占一半以上\n• 用豆腐、毛豆、鹰嘴豆这类豆制品替代部分红肉\n\n好消息是：地中海饮食没有特别严格的禁忌，它强调的是整体模式。偶尔吃一顿"不完美"的饭完全没问题。',
        en: '**The most practical changes to start with**\n\nYou don\'t need to overhaul everything overnight. These changes have the strongest evidence and are the easiest to implement:\n\n• Swap refined vegetable oil for extra-virgin olive oil (simplest change with the biggest impact)\n• Schedule fish twice a week (salmon, sardines, mackerel have the most omega-3)\n• Have a handful of mixed nuts daily (walnuts + almonds, ~30g)\n• Make vegetables at least half your plate at lunch or dinner\n• Replace some red meat with tofu, edamame, or chickpeas\n\nGood news: the Mediterranean diet has no strict prohibitions. It\'s about the overall pattern — occasional imperfect meals are completely fine.',
      },
    ],
    source: 'Estruch R. et al., NEJM 2013 (PREDIMED); PREDIMED-Plus, 2020',
    readMinutes: 4,
  },
  {
    id: 'ultra-processed-inflammation',
    tag: '超加工食品',
    tagEn: 'Ultra-Processed Foods',
    title: {
      zh: '为什么吃配料表很长的食物会让你更容易发炎',
      en: 'Why Foods With Long Ingredient Lists Are Making You More Inflamed',
    },
    summary: {
      zh: '一个简单的判断方法：如果一个食品的配料表里出现了你在厨房里不会用到的东西，它可能就是"超加工食品"。研究发现，这类食品吃得越多，炎症越高、寿命越短——问题不只是热量，而是工业加工本身。',
      en: 'A simple rule: if a food\'s ingredient list contains things you wouldn\'t find in your kitchen, it\'s probably ultra-processed. Research shows the more of these you eat, the higher your inflammation and the shorter your life — and the problem isn\'t just calories, it\'s the industrial processing itself.',
    },
    body: [
      {
        zh: '**什么是"超加工食品"？**\n\n巴西营养学家 Monteiro 教授团队提出了一个叫 NOVA 的分类系统，把食物分成四大类。其中第四类"超加工食品"的定义很直白：\n\n这些食品主要由工业提取的成分拼凑而成（氢化油、变性淀粉、蛋白质水解物），然后加入大量添加剂（乳化剂、增味剂、人工色素、防腐剂），让它们看起来好看、吃起来上瘾、保质期很长。\n\n常见的超加工食品：\n• 方便面、薯片、饼干\n• 火腿肠、香肠、午餐肉\n• 碳酸饮料、奶茶、含糖果汁\n• 大多数早餐麦片\n• 甜甜圈、蛋糕、工业面包',
        en: '**What are "ultra-processed foods"?**\n\nBrazilian nutritionist Professor Monteiro\'s team created a system called NOVA that splits foods into four groups. Group 4 — ultra-processed foods — has a clear definition:\n\nThese foods are assembled mainly from industrially extracted ingredients (hydrogenated oils, modified starches, protein hydrolysates), then loaded with additives (emulsifiers, flavor enhancers, artificial colors, preservatives) to make them look good, taste addictive, and last a long time.\n\nCommon ultra-processed foods:\n• Instant noodles, chips, crackers\n• Processed sausage, ham, luncheon meat\n• Soda, bubble tea, sweetened juice\n• Most breakfast cereals\n• Donuts, packaged cakes, industrial bread',
      },
      {
        zh: '**研究数据说了什么？**\n\n证据已经非常充分了。来看几个关键数字：\n\n• 法国一项追踪 10 万人的研究发现，超加工食品摄入量最高的人，患癌症风险高 23%\n• 另一项追踪 4.4 万法国成年人的研究（发表于《BMJ》）：超加工食品每多摄入 10%，全因死亡率上升 14%\n• 美国一项研究显示，超加工食品消费最多的人，抑郁症风险显著更高\n\n这些研究都控制了热量因素——也就是说，即使超加工食品和"真实食物"的卡路里相同，吃超加工食品的危害也更大。',
        en: '**What does the research say?**\n\nThe evidence is now substantial. Here are some key numbers:\n\n• A French study tracking 100,000 people found that highest ultra-processed food consumers had 23% higher cancer risk\n• Another study of 44,000 French adults (published in BMJ): every 10% increase in UPF intake raised all-cause mortality by 14%\n• A US study found that highest UPF consumers had significantly higher depression risk\n\nAll these studies controlled for calorie intake — meaning even when ultra-processed foods have the same calories as real food, they cause more harm.',
      },
      {
        zh: '**为什么有害？不只是因为糖和油**\n\n很多人以为超加工食品的问题是"高热量、高糖、高脂"，这是对的，但不完整。有一个机制更隐蔽：\n\n乳化剂（配料表里常见的"卵磷脂"、"羧甲基纤维素"等）会直接破坏肠道黏液层，增加肠道通透性，让本来应该留在肠道里的细菌碎片（内毒素）进入血液，引发持续的低度全身性炎症。\n\n这种炎症你感觉不到，但它在后台悄悄加速动脉硬化、胰岛素抵抗和细胞衰老。',
        en: '**Why are they harmful? It\'s not just sugar and fat**\n\nMost people think ultra-processed foods are problematic because they\'re high in calories, sugar, and fat. That\'s true, but incomplete. There\'s a more hidden mechanism:\n\nEmulsifiers (common on ingredient lists as "lecithin," "carboxymethylcellulose," etc.) directly disrupt the intestinal mucus layer, increasing gut permeability and allowing bacterial fragments (endotoxins) that should stay inside the gut to enter the bloodstream, triggering persistent low-grade systemic inflammation.\n\nYou can\'t feel this inflammation, but it quietly accelerates arterial stiffening, insulin resistance, and cellular aging in the background.',
      },
      {
        zh: '**怎么判断一个食品是不是超加工食品？**\n\n最简单的方法：看配料表。如果出现以下成分，基本就是超加工食品了：\n\n• 氢化植物油 / 植物起酥油\n• 变性淀粉 / 食用淀粉（而非天然淀粉）\n• 各类 E 编码添加剂（E102、E471 等）\n• 人工香精 / 香料\n• 亚硝酸盐 / 亚硝酸钠\n\n**替换建议**：薯片→坚果，火腿肠→鸡蛋或豆腐，甜饮料→气泡水加柠檬，早餐麦片→燕麦。不需要完全戒掉，减少频率和量就已经有很大帮助。',
        en: '**How to tell if something is ultra-processed?**\n\nSimplest method: read the ingredient list. If you see any of the following, it\'s very likely ultra-processed:\n\n• Hydrogenated vegetable oil / shortening\n• Modified starch / food starch (rather than natural starch)\n• E-code additives (E102, E471, etc.)\n• Artificial flavoring / flavors\n• Sodium nitrite / nitrates\n\n**Swap suggestions**: chips→nuts, processed sausage→eggs or tofu, sweet drinks→sparkling water with lemon, sweetened cereal→oats. You don\'t need to cut them out completely — reducing frequency and quantity already makes a significant difference.',
      },
    ],
    source: 'Monteiro CA. et al., Public Health Nutr 2019; Schnabel L. et al., JAMA 2019; Fiolet T. et al., BMJ 2018',
    readMinutes: 4,
  },
  {
    id: 'omega3-anti-inflammatory',
    tag: '抗炎营养',
    tagEn: 'Anti-Inflammatory',
    title: {
      zh: 'Omega-3：不只是"好脂肪"，它是身体自带的灭火器',
      en: 'Omega-3: Not Just "Good Fat" — Your Body\'s Built-In Fire Extinguisher',
    },
    summary: {
      zh: '大多数人知道 Omega-3 对心脏好，但很少人了解它背后的机制有多精妙。它不是被动地"减少坏东西"，而是主动生成一类叫"消退素"的物质，帮助身体把炎症彻底关掉——这在营养素里非常罕见。',
      en: 'Most people know omega-3 is good for the heart, but few understand how sophisticated the mechanism is. It doesn\'t just passively "reduce bad things" — it actively generates compounds called resolvins that help the body fully switch off inflammation. That\'s remarkably rare among nutrients.',
    },
    body: [
      {
        zh: '**先搞清楚 Omega-3 有哪几种**\n\nOmega-3 不是一种东西，主要有三种形式：\n\n• **ALA**（α-亚麻酸）：来自亚麻籽、核桃、奇亚籽。植物来源，但人体几乎无法直接利用它——转化为 EPA/DHA 的效率不到 5%\n• **EPA**（二十碳五烯酸）：来自深海鱼类和藻油，是抗炎的核心分子\n• **DHA**（二十二碳六烯酸）：同样来自深海鱼类和藻油，大脑和视网膜的主要结构脂肪\n\n所以吃核桃补 Omega-3 是有帮助的，但远不如直接吃鱼或藻油有效。',
        en: '**First, let\'s clarify what omega-3 actually is**\n\nOmega-3 isn\'t one thing — there are three main forms:\n\n• **ALA** (alpha-linolenic acid): from flaxseed, walnuts, chia seeds. A plant source, but your body can barely use it — conversion to EPA/DHA is less than 5%\n• **EPA** (eicosapentaenoic acid): from cold-water fish and algae oil — the core anti-inflammatory molecule\n• **DHA** (docosahexaenoic acid): also from fish and algae oil — the main structural fat in your brain and retina\n\nSo eating walnuts for omega-3 is helpful, but far less effective than eating fish or algae oil directly.',
      },
      {
        zh: '**Omega-3 是怎么"灭火"的？**\n\n它有两个层面的作用，第一层比较好理解：\n\nEPA 和 DHA 会嵌入细胞膜，把一种叫"花生四烯酸"（AA）的促炎脂肪酸挤走。AA 是合成促炎物质（前列腺素、白三烯）的原料——原料少了，炎症信号自然减弱。\n\n但第二层更厉害：EPA 和 DHA 不只是被动减少炎症，它们还会主动生成一类叫**消退素（resolvins）**和**保护素（protectins）**的物质。这些分子的作用是主动"召集清洁工"——招募巨噬细胞来清理炎症残留物，然后给免疫系统发出"任务完成，可以撤退"的信号。\n\n大多数抗炎药物只做第一层（压制炎症），而 Omega-3 还做了第二层（主动消除炎症）。这是它与众不同的地方。',
        en: '**How does omega-3 "extinguish" inflammation?**\n\nIt works on two levels. The first is easier to understand:\n\nEPA and DHA embed themselves into cell membranes and displace a pro-inflammatory fatty acid called arachidonic acid (AA). AA is the raw material for making inflammatory compounds (prostaglandins, leukotrienes) — less raw material means weaker inflammatory signals.\n\nBut the second level is more impressive: EPA and DHA don\'t just passively reduce inflammation — they actively generate compounds called **resolvins** and **protectins**. These molecules act as active "cleanup crews" — recruiting macrophages to clear inflammatory debris and then signaling the immune system "mission complete, stand down."\n\nMost anti-inflammatory drugs only do the first level (suppress inflammation). Omega-3 also does the second level (actively resolve inflammation). That\'s what makes it unique.',
      },
      {
        zh: '**研究数据：心脏健康的证据最扎实**\n\n• **GISSI-Prevenzione 试验**：追踪 11,000 名心肌梗死幸存者，补充 Omega-3 让心血管死亡率下降 30%\n• **AHA（美国心脏协会）数据**：每周吃 2 次以上富含脂肪的鱼，冠心病死亡风险降低约 36%\n• 多项研究显示：每日补充 2-4g EPA+DHA，可使 CRP（炎症指标）和 IL-6 显著下降\n\n有趣的是，近年也有一些研究结果不一致，科学界目前认为**从天然食物摄入 Omega-3**（而非单纯补剂）的效果更稳定。',
        en: '**The research data: heart health has the strongest evidence**\n\n• **GISSI-Prevenzione trial**: tracked 11,000 heart attack survivors — omega-3 supplementation reduced cardiovascular mortality by 30%\n• **AHA (American Heart Association) data**: eating fatty fish twice or more per week reduces coronary heart disease mortality by ~36%\n• Multiple studies show: 2–4g EPA+DHA daily significantly lowers CRP (inflammation marker) and IL-6\n\nInterestingly, some recent studies show inconsistent results. The scientific consensus now is that getting omega-3 from **whole foods** (rather than supplements alone) produces more consistent benefits.',
      },
      {
        zh: '**怎么吃？最优食物来源**\n\n按每 100g 含 EPA+DHA 的量排名：\n\n• 大西洋三文鱼：约 2.5g（最高）\n• 鲭鱼（青花鱼）：约 2.3g\n• 沙丁鱼：约 1.5g（罐头也行）\n• 金枪鱼（罐头）：约 0.3-1g\n• 虾、贝类：0.2-0.5g\n\n**实操目标**：每周至少 2 次，每次约 150g 的富含脂肪的鱼。\n\n如果你不常吃鱼，可以考虑**藻油补充剂**——这是 EPA/DHA 的纯素来源（鱼的 Omega-3 本来就是从藻类来的），效果和鱼油相当。\n\n最后一点：尽量减少葵花籽油、玉米油等富含 Omega-6 的油——它们会和 Omega-3 争同一套代谢酶，削弱 Omega-3 的效果。',
        en: '**How to eat it? Best food sources**\n\nRanked by EPA+DHA per 100g:\n\n• Atlantic salmon: ~2.5g (highest)\n• Mackerel: ~2.3g\n• Sardines: ~1.5g (canned works fine)\n• Tuna (canned): ~0.3–1g\n• Shrimp, shellfish: 0.2–0.5g\n\n**Practical target**: at least twice a week, ~150g of fatty fish each time.\n\nIf you rarely eat fish, consider **algae oil supplements** — this is the plant-based source of EPA/DHA (fish get their omega-3 from algae anyway), and it works just as well as fish oil.\n\nOne more thing: try to reduce sunflower oil, corn oil, and other omega-6-heavy oils — they compete with omega-3 for the same metabolic enzymes and weaken omega-3\'s effects.',
      },
    ],
    source: 'Marchioli R. et al., Lancet 2002 (GISSI); Serhan CN., Nature Rev Immunol 2014; AHA Scientific Statement 2018',
    readMinutes: 5,
  },
  {
    id: 'gut-microbiome-fermented',
    tag: '肠道健康',
    tagEn: 'Gut Health',
    title: {
      zh: '你肠道里的 38 万亿个"房客"，正在悄悄控制你的免疫系统',
      en: 'The 38 Trillion "Tenants" in Your Gut Are Quietly Controlling Your Immune System',
    },
    summary: {
      zh: '斯坦福大学 2021 年做了一个实验：让一组人每天吃发酵食品，只坚持 10 周，肠道菌群多样性显著提升，19 种炎症蛋白全部下降。对照组只增加膳食纤维，效果明显不如。',
      en: 'A Stanford experiment in 2021: one group ate fermented foods daily for just 10 weeks — gut microbiome diversity significantly increased, and 19 inflammatory proteins all decreased. The group that only increased dietary fiber showed clearly weaker effects.',
    },
    body: [
      {
        zh: '**你体内有多少微生物？**\n\n人体肠道里大约住着 38 万亿个微生物。这个数字和你全身的细胞数量差不多——也就是说，你其实是"人类细胞"和"微生物细胞"各占一半的复合体。\n\n这些微生物合在一起，基因数量是人类基因组的 150 倍。它们分泌的物质、和免疫系统的对话，每时每刻都在发生。\n\n有一个数字很能说明问题：你体内大约 **70% 的免疫细胞，都集中在肠道黏膜周围**。免疫系统不只在血液里——它大部分在肠道里待命，和这些"房客"随时沟通。',
        en: '**How many microbes live in you?**\n\nYour gut houses approximately 38 trillion microorganisms — roughly the same as the total number of cells in your body. In other words, you\'re essentially a composite being, half human cells and half microbial cells.\n\nThese microbes together carry 150 times more genes than the human genome. The substances they secrete and their constant communication with the immune system never stop.\n\nOne number illustrates this well: about **70% of your immune cells are concentrated around the gut mucosa**. The immune system isn\'t just in the bloodstream — most of it is stationed in the gut, constantly communicating with these "tenants."',
      },
      {
        zh: '**斯坦福的那个实验**\n\n2021 年，斯坦福大学 Sonnenburg 实验室在《Cell》上发表了一项精心设计的随机对照试验。他们把参与者分成两组：\n\n• **发酵食品组**：每天大量吃酸奶、开菲尔、发酵奶酪、泡菜、康普茶等\n• **高纤维组**：每天大量吃蔬菜、豆类、全谷物等富含纤维的食物\n\n10 周后，结果让研究者也有点意外：\n\n• 发酵食品组：肠道菌群多样性显著上升，19 种炎症标志物（包括 IL-17A、IL-6、IFN-γ）显著下降\n• 高纤维组：也有改善，但炎症下降幅度小得多，而且效果因人差异很大\n\n结论不是说纤维没用——纤维非常重要。但如果你肠道菌群的多样性本来就不够，吃进去的纤维没有足够的细菌来发酵，效果就会打折扣。',
        en: '**The Stanford experiment**\n\nIn 2021, the Sonnenburg lab at Stanford published a carefully designed randomized controlled trial in Cell. They split participants into two groups:\n\n• **Fermented food group**: daily large amounts of yogurt, kefir, fermented cheese, kimchi, kombucha, etc.\n• **High-fiber group**: daily large amounts of vegetables, legumes, whole grains, and other fiber-rich foods\n\nAfter 10 weeks, the results surprised even the researchers:\n\n• Fermented food group: gut microbiome diversity significantly increased; 19 inflammatory markers (including IL-17A, IL-6, IFN-γ) significantly decreased\n• High-fiber group: also improved, but inflammation reduction was much smaller and highly variable between individuals\n\nThe conclusion isn\'t that fiber is useless — fiber is extremely important. But if your gut microbiome diversity is already low, the fiber you eat has too few bacteria to ferment it, and the benefits are diminished.',
      },
      {
        zh: '**"短链脂肪酸"：菌群和免疫系统之间的语言**\n\n当益生菌发酵你吃下去的膳食纤维，它们会产生一类叫"短链脂肪酸"（SCFA）的物质，主要有三种：丁酸、丙酸、乙酸。\n\n这三种物质非常重要：\n\n• **丁酸**：是肠道上皮细胞的主要能量来源，修复和维持肠道黏液层，减少"肠漏"（肠道通透性过高）\n• **丙酸**：进入肝脏，帮助调节血糖和脂肪代谢\n• **乙酸**：参与脂肪酸代谢，并向免疫细胞发送抗炎信号\n\n简单说：你吃的纤维，被菌群发酵后，变成了和免疫系统"说话"的信使分子。',
        en: '**"Short-chain fatty acids": the language between your microbiome and immune system**\n\nWhen probiotic bacteria ferment the dietary fiber you eat, they produce compounds called short-chain fatty acids (SCFAs) — mainly three types: butyrate, propionate, and acetate.\n\nThese three are critical:\n\n• **Butyrate**: the primary energy source for intestinal epithelial cells; repairs and maintains the gut mucus layer, reducing "leaky gut" (excess intestinal permeability)\n• **Propionate**: enters the liver to help regulate blood sugar and fat metabolism\n• **Acetate**: participates in fatty acid metabolism and sends anti-inflammatory signals to immune cells\n\nSimply put: the fiber you eat gets fermented by your microbiome and converted into messenger molecules that "talk" to your immune system.',
      },
      {
        zh: '**怎么实际操作？**\n\n关键是**多样性**，不是只吃一种发酵食品。不同发酵食品含有不同的菌株，多样化摄入才能建立丰富的菌群。\n\n几个容易做到的：\n\n• **早餐**：一碗希腊酸奶（选无糖的），加一些坚果和水果\n• **午餐/晚餐**：加一小碟韩式泡菜或酸菜作为配菜\n• **喝汤时**：用味噌做汤底，但注意——**味噌不要一起煮，出锅后再加**，高温会杀死活菌\n• **想换口味**：偶尔喝开菲尔或康普茶\n• **进阶选手**：纳豆，菌群多样性最高的发酵食品之一，还含有大量维生素 K2（对骨骼和心血管都好）\n\n每天有一份发酵食品就够了，不需要顿顿都有。',
        en: '**How to actually do this?**\n\nThe key is **diversity**, not just eating one type of fermented food. Different fermented foods contain different bacterial strains — variety builds a richer microbiome.\n\nEasy things to start with:\n\n• **Breakfast**: a bowl of Greek yogurt (unsweetened), with some nuts and fruit\n• **Lunch/dinner**: a small side of kimchi or sauerkraut\n• **When making soup**: use miso as a base, but — **don\'t cook the miso with the soup; add it after it\'s off the heat** — high heat kills live cultures\n• **Variety**: occasionally drink kefir or kombucha\n• **Advanced**: natto, one of the highest-diversity fermented foods, also rich in vitamin K2 (good for bones and cardiovascular health)\n\nOne serving of fermented food a day is enough — you don\'t need it at every meal.',
      },
    ],
    source: 'Wastyk HC. et al., Cell 2021; Sonnenburg JL & Bäckhed F, Nature 2016; Koh A. et al., Cell 2016',
    readMinutes: 5,
  },
  {
    id: 'whole-grains-metabolic',
    tag: '代谢健康',
    tagEn: 'Metabolic Health',
    title: {
      zh: '白米饭和糙米饭的差距，比你想的大得多',
      en: 'The Gap Between White Rice and Brown Rice Is Bigger Than You Think',
    },
    summary: {
      zh: '《柳叶刀》上的一项大型综合分析显示，每天多吃 25g 膳食纤维（大约一碗燕麦），2 型糖尿病风险降低 26%，心血管疾病风险降低 21%。从白米换到糙米，是最容易做到的改变之一。',
      en: 'A major meta-analysis in The Lancet found that eating an additional 25g of fiber daily (roughly one bowl of oats) reduces type 2 diabetes risk by 26% and cardiovascular risk by 21%. Switching from white to brown rice is one of the easiest changes you can make.',
    },
    body: [
      {
        zh: '**精制谷物丢掉了什么？**\n\n一粒完整的谷物由三部分组成：\n\n• **麸皮**（外层）：含有大量膳食纤维、B 族维生素、矿物质（镁、锌、铁）、抗氧化多酚\n• **胚芽**（种子的"芯"）：富含维生素 E、天然 Omega-3 脂肪酸、植化素\n• **胚乳**（中间最大的部分）：主要是淀粉，也是白米饭和白面粉的来源\n\n精制加工只保留了胚乳，把麸皮和胚芽都去掉了。结果是：约 75% 的纤维、大部分的 B 族维生素和矿物质，全部流失。\n\n剩下的，基本就是一袋高度消化的淀粉。',
        en: '**What does refined grain throw away?**\n\nA complete grain has three parts:\n\n• **Bran** (outer layer): large amounts of dietary fiber, B vitamins, minerals (magnesium, zinc, iron), and antioxidant polyphenols\n• **Germ** (the "core" of the seed): rich in vitamin E, natural omega-3 fatty acids, and phytonutrients\n• **Endosperm** (the largest middle part): mainly starch — the source of white rice and white flour\n\nRefining only keeps the endosperm and discards the bran and germ. The result: ~75% of fiber, most B vitamins and minerals — all gone.\n\nWhat\'s left is essentially a bag of highly digestible starch.',
      },
      {
        zh: '**吃白米饭和吃糙米饭，身体里发生了什么不同的事？**\n\n假设你吃了同样热量的白米饭和糙米饭，接下来几个小时里：\n\n**白米饭**：淀粉被快速水解，血糖快速升高，胰岛素大量分泌，血糖随后快速下降，1-2 小时后又开始感到饿。长期下来，胰岛素持续高分泌会导致胰岛素抵抗。\n\n**糙米饭**：纤维减慢了淀粉的消化速度，血糖缓慢平稳上升，需要的胰岛素更少，血糖下降也更缓慢，饱腹感维持更久。\n\n每一顿饭这个差距都不大，但日积月累，对代谢健康的影响是深远的。',
        en: '**What happens differently in your body after white rice vs brown rice?**\n\nAssume you eat the same calories of white rice and brown rice. Here\'s what happens over the next few hours:\n\n**White rice**: starch is rapidly hydrolyzed, blood sugar rises quickly, insulin surges, blood sugar then drops quickly, hunger returns within 1–2 hours. Long-term, continuously high insulin secretion leads to insulin resistance.\n\n**Brown rice**: fiber slows starch digestion, blood sugar rises slowly and steadily, less insulin is needed, blood sugar drops more gradually, satiety lasts longer.\n\nThe difference at any single meal is small, but accumulated over time, the impact on metabolic health is profound.',
      },
      {
        zh: '**燕麦为什么特别值得吃？**\n\n燕麦含有一种叫 **β-葡聚糖**的可溶性纤维，是目前食品中降胆固醇效果最有证据支撑的成分之一。\n\n它是怎么起作用的？β-葡聚糖在肠道里形成一种黏稠的凝胶，把胆汁酸包裹住，随粪便排出体外。肝脏需要胆固醇来重新合成胆汁酸，就会从血液里"提取"更多胆固醇，于是血液中的 LDL（坏胆固醇）就下来了。\n\n欧洲食品安全局（EFSA）已经正式认证：每天摄入 **3g β-葡聚糖**（大约一碗燕麦粥），可以有助于维持正常血液胆固醇水平。',
        en: '**Why is oatmeal especially worth eating?**\n\nOats contain a soluble fiber called **β-glucan** — one of the best-evidenced cholesterol-lowering food components that exists.\n\nHow does it work? β-glucan forms a viscous gel in the intestine that traps bile acids and carries them out in feces. The liver needs cholesterol to re-synthesize bile acids, so it "extracts" more cholesterol from the blood — and LDL (bad cholesterol) goes down.\n\nThe European Food Safety Authority (EFSA) has formally certified: consuming **3g of β-glucan per day** (roughly one bowl of oatmeal) helps maintain normal blood cholesterol levels.',
      },
      {
        zh: '**实际怎么做？**\n\n不需要完全告别白米饭，有几个很容易坚持的方式：\n\n• **最简单的**：糙米和白米按 1:2 的比例混煮，口感差别很小，但营养提升明显\n• **早餐首选**：燕麦粥（钢切燕麦最好，即食燕麦次之），不要买那种"即溶"加糖款\n• **买全麦面包时**：看配料表，确认"全麦粉"是第一位成分，不然可能只是加了点麦麸上色的普通面包\n• **尝试新主食**：藜麦（所有必需氨基酸，无麸质）、荞麦面、小米粥\n\n记住：任何打着"全麦"旗号但配料表里白面粉排第一的产品，基本都是噱头。',
        en: '**How to actually do this?**\n\nYou don\'t need to completely give up white rice. Here are some easy, sustainable approaches:\n\n• **Easiest**: mix brown and white rice in a 1:2 ratio — barely noticeable difference in texture, meaningful nutritional upgrade\n• **Best breakfast**: oatmeal (steel-cut is best, rolled oats are second — avoid the instant packets with added sugar)\n• **When buying "whole wheat" bread**: check that "whole wheat flour" is the first ingredient — many products are just regular bread with a bit of wheat bran added for color\n• **Try new grains**: quinoa (all essential amino acids, gluten-free), buckwheat noodles, millet porridge\n\nRemember: any product marketed as "whole grain" where white flour appears first in the ingredients is essentially marketing spin.',
      },
    ],
    source: 'Reynolds A. et al., Lancet 2019; Aune D. et al., BMJ 2016; EFSA Oat β-glucan Health Claim 2011',
    readMinutes: 4,
  },
  {
    id: 'plant-diversity-immunity',
    tag: '植物多样性',
    tagEn: 'Plant Diversity',
    title: {
      zh: '每周 30 种植物：听起来很多，实际上比你想的容易',
      en: 'Eat 30 Plant Foods a Week: Sounds Like a Lot, Easier Than You Think',
    },
    summary: {
      zh: '美国肠道项目分析了 1 万名参与者的饮食数据，发现每周吃超过 30 种植物的人，肠道菌群多样性远高于只吃 10 种以下的人。而且颜色越多，效果越好——这背后有非常具体的科学理由。',
      en: 'The American Gut Project analyzed dietary data from 10,000 participants and found that people eating more than 30 different plant foods per week had far greater gut microbiome diversity than those eating fewer than 10. And the more colors, the better — for very specific scientific reasons.',
    },
    body: [
      {
        zh: '**为什么是 30 这个数字？**\n\n这个数字来自美国肠道项目（American Gut Project）——目前最大规模的公民科学肠道菌群研究，收集了来自全球超过 10,000 名参与者的粪便样本和饮食数据。\n\n他们发现了一个非常清晰的规律：\n\n• 每周吃 1-10 种植物的人：菌群多样性最低\n• 每周吃 11-20 种：中等\n• 每周吃 21-30 种：较高\n• 每周吃 30 种以上：菌群多样性和免疫功能都明显更好，炎症标志物也更低\n\n30 种是一个统计上出现"跃升"效应的门槛，不是随便拍脑袋定的数字。',
        en: '**Why the number 30?**\n\nThis number comes from the American Gut Project — currently the largest citizen science gut microbiome study, collecting stool samples and dietary data from more than 10,000 participants worldwide.\n\nThey found a very clear pattern:\n\n• People eating 1–10 plant foods per week: lowest microbiome diversity\n• 11–20: moderate\n• 21–30: higher\n• More than 30 per week: significantly better microbiome diversity and immune function, with lower inflammatory markers\n\n30 is a threshold where a statistical "leap" in benefits occurs — not an arbitrary number.',
      },
      {
        zh: '**"植物"的定义比你想的宽**\n\n很多人听到"30 种植物"会觉得很难，但其实可以计入的范围很广：\n\n• 每一种蔬菜算一种（菠菜和西兰花是两种，不是同一种）\n• 每一种水果算一种（苹果和蓝莓是两种）\n• 每一种全谷物算一种（燕麦和糙米是两种）\n• 每一种豆类算一种（黑豆和鹰嘴豆是两种）\n• 每一种坚果算一种（核桃和杏仁是两种）\n• **香料和香草也算！**（大蒜、生姜、姜黄、肉桂、黑胡椒……每个都算一种）\n\n香料尤其值得重视：它们的多酚浓度极高，每天做饭加几种香料，就轻松多了好几种植物。',
        en: '**"Plants" is broader than you think**\n\nMany people hear "30 plant foods" and feel overwhelmed. But what counts is broader than expected:\n\n• Each vegetable counts as one (spinach and broccoli are two, not one)\n• Each fruit counts as one (apple and blueberries are two)\n• Each whole grain counts as one (oats and brown rice are two)\n• Each legume counts as one (black beans and chickpeas are two)\n• Each nut counts as one (walnuts and almonds are two)\n• **Herbs and spices count too!** (garlic, ginger, turmeric, cinnamon, black pepper… each counts)\n\nSpices deserve special attention: they have extremely high polyphenol concentrations. Adding a few spices while cooking every day easily adds several plant varieties.',
      },
      {
        zh: '**为什么多样性比"吃多少"更重要？**\n\n每种植物都含有独特的：\n\n• 多酚组合（蓝莓的花青素和苹果的槲皮素就完全不同）\n• 纤维类型（燕麦的 β-葡聚糖和豆类的果胶是两种结构不同的纤维）\n• 植化素（西兰花的萝卜硫素、番茄的番茄红素、大蒜的蒜素……）\n\n不同的植物化合物喂养不同的肠道菌种。肠道菌群的多样性越高，它的"功能储备"越强——某一种菌减少时，其他菌可以接替它的工作。\n\n这就是为什么吃很多同一种蔬菜，不如吃少量多种类的蔬菜对菌群更友好。',
        en: '**Why does diversity matter more than quantity?**\n\nEach plant contains unique:\n\n• Polyphenol combinations (blueberry anthocyanins and apple quercetin are completely different)\n• Fiber types (oat β-glucan and legume pectin have different structures)\n• Phytonutrients (broccoli sulforaphane, tomato lycopene, garlic allicin…)\n\nDifferent plant compounds feed different gut microbial species. The higher the gut microbiome diversity, the stronger its "functional reserve" — when one bacterial species declines, others can take over its functions.\n\nThis is why eating large amounts of one vegetable is less microbiome-friendly than eating smaller amounts of many different vegetables.',
      },
      {
        zh: '**一周 30 种怎么做到？来看一个真实的例子**\n\n这是一个普通一周的植物摄入，你会发现其实很自然就超过了：\n\n**早餐每天**：燕麦（1）+ 蓝莓（2）+ 核桃（3）+ 亚麻籽（4）= 4种\n**午餐（3天）**：菠菜（5）+ 番茄（6）+ 胡萝卜（7）+ 鹰嘴豆（8）+ 黄瓜（9）\n**晚餐调味料（每天用）**：大蒜（10）+ 生姜（11）+ 葱（12）+ 黑胡椒（13）\n**晚餐主食（交替）**：糙米（14）+ 藜麦（15）+ 荞麦面（16）\n**水果（一周交替）**：苹果（17）+ 橙子（18）+ 草莓（19）+ 香蕉（20）\n**其他蔬菜（一周出现）**：西兰花（21）+ 南瓜（22）+ 茄子（23）+ 豆腐（24）+ 毛豆（25）\n**坚果零食**：杏仁（26）+ 腰果（27）\n**香料**：姜黄（28）+ 肉桂（29）+ 辣椒（30）\n\n轻松 30 种，而且这还只是保守估计。',
        en: '**How to hit 30 in a week? Here\'s a realistic example**\n\nHere\'s a typical week\'s plant intake — you\'ll find it naturally exceeds 30:\n\n**Daily breakfast**: oats (1) + blueberries (2) + walnuts (3) + flaxseed (4) = 4 plants\n**Lunch (3 days)**: spinach (5) + tomato (6) + carrot (7) + chickpeas (8) + cucumber (9)\n**Dinner seasonings (daily)**: garlic (10) + ginger (11) + scallion (12) + black pepper (13)\n**Dinner grains (rotating)**: brown rice (14) + quinoa (15) + buckwheat noodles (16)\n**Fruit (rotating through week)**: apple (17) + orange (18) + strawberries (19) + banana (20)\n**Other veggies (appearing during week)**: broccoli (21) + pumpkin (22) + eggplant (23) + tofu (24) + edamame (25)\n**Nut snacks**: almonds (26) + cashews (27)\n**Spices**: turmeric (28) + cinnamon (29) + chili (30)\n\nEasily 30 — and that\'s a conservative count.',
      },
    ],
    source: 'McDonald D. et al., mSystems 2018 (American Gut Project); Dahl WJ & Stewart ML, Adv Nutr 2015; Sonnenburg lab communications 2021',
    readMinutes: 4,
  },
];
