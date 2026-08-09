const commonAdvantages = [
  "High-voltage AC brushless motor architecture.",
  "Overheat protection and power-failure restart protection.",
  "Water-resistant body design for the intended working environment.",
  "Configuration review available for voltage, plug and accessory requirements."
];

function specs(rows) {
  return rows.map(([label, value]) => ({ label, value, verified: true }));
}

export const VERIFIED_PRODUCT_TECHNICAL_DATA = {
  "KFT-Q450BrushlessJigSaw": {
    title: "KFT-Q450 800W AC Brushless Jig Saw",
    model: "KFT-Q450",
    summary: "An 800W AC brushless jig saw for controlled curved cuts, shaped openings and finishing work in wood, plastic and thin metal sheet.",
    productIntroduction: "KFT-Q450 is an AC brushless jig saw for woodworking, interior fit-out and detailed cutting tasks. Its six-speed adjustment and three-stage orbital action are intended to help buyers match the cutting rhythm to the selected material and finish requirement. Confirm blade selection, voltage, plug and final pack configuration for the destination market before ordering.",
    performance: "Six speed settings cover 1500-3800 r/min for material-specific cutting. The supplied technical material also describes three-stage orbital action and a low-vibration design for controlled curve cutting.",
    applications: ["Furniture and joinery work", "Interior decoration and trim cutting", "Shaped openings in wood and plastic", "Thin metal sheet cutting"],
    features: [...commonAdvantages, "Six-speed adjustment and three-stage orbital action.", "45 mm listed cutting depth for the supplied configuration."],
    specifications: specs([["Rated power", "800W"], ["Speed settings", "6 settings"], ["Cutting depth", "45 mm"], ["Rated speed", "1500-3800 r/min"], ["Rated voltage", "220V"], ["Rated frequency", "50Hz"], ["Net weight", "2 kg"]])
  },
  "6000wsolttingmachine": {
    title: "KFT-K230 6000W AC Brushless Wall Chaser",
    model: "KFT-K230",
    summary: "A 6000W AC brushless wall chaser for controlled slotting and cutting in concrete, brick and stone wall materials.",
    productIntroduction: "KFT-K230 is a 6000W AC brushless wall chaser for planned cable and pipe routes in concrete, red brick, stone and marble walls. The final blade, plug, voltage and protective equipment must be confirmed for the target jobsite and market before quotation.",
    performance: "The supplied record lists a 230 mm blade, up to 80 mm cutting depth and 7200 r/min. It is positioned for controlled one-pass wall-slotting work where the material and final blade configuration have been confirmed.",
    applications: ["Electrical cable route preparation", "Pipe and conduit channel planning", "Concrete and brick renovation work", "Building services installation"],
    features: [...commonAdvantages, "230 mm blade format with up to 80 mm listed cutting depth.", "Multi-material wall-cutting applications subject to the confirmed blade and site controls."],
    specifications: specs([["Rated power", "6000W"], ["Blade diameter", "230 mm"], ["Maximum cutting depth", "80 mm"], ["Rated speed", "7200 r/min"], ["Rated voltage", "220V"], ["Rated frequency", "50Hz"], ["Net weight", "3.5 kg"]])
  },
  HeavyCuttingMachine: {
    title: "KFT-K210 5500W AC Brushless Wall Chaser",
    model: "KFT-K210",
    summary: "A 5500W AC brushless wall chaser for planned cable and pipe channels in concrete, brick and stone wall materials.",
    productIntroduction: "KFT-K210 is a 5500W AC brushless wall chaser for wall slotting and cutting work in concrete, red brick, stone and marble. Confirm the required blade, voltage, plug and final accessory set before a project or distribution order is approved.",
    performance: "The supplied data lists a 210 mm blade, up to 80 mm cutting depth and 7200 r/min for controlled wall-channel work.",
    applications: ["Electrical installation channels", "Pipe route preparation", "Concrete wall renovation", "Building services fit-out"],
    features: [...commonAdvantages, "210 mm blade format with up to 80 mm listed cutting depth."],
    specifications: specs([["Rated power", "5500W"], ["Blade diameter", "210 mm"], ["Maximum cutting depth", "80 mm"], ["Rated speed", "7200 r/min"], ["Rated voltage", "220V"], ["Rated frequency", "50Hz"], ["Net weight", "3.5 kg"]])
  },
  CuttingMachine: {
    title: "KFT-K190 2800W AC Brushless Wall Slotting Machine",
    model: "KFT-K190",
    summary: "A 2800W AC brushless wall slotting machine for controlled channels in concrete, brick, stone and marble walls.",
    productIntroduction: "KFT-K190 is a 2800W AC brushless wall slotting machine for cable and pipe channel preparation in concrete, red brick, stone and marble. Check the approved blade, voltage, plug and site safety controls against the final order configuration.",
    performance: "The supplied data lists a 190 mm blade, up to 55 mm cutting depth and 7200 r/min. The source material describes a dual-cutting process for curved-slot work, subject to the final configuration and operator procedure.",
    applications: ["Concealed electrical cable channels", "Pipe and conduit routing", "Masonry renovation", "Building services installation"],
    features: [...commonAdvantages, "190 mm blade format with up to 55 mm listed cutting depth.", "Dual-cutting process described for applicable curved-slot work."],
    specifications: specs([["Rated power", "2800W"], ["Blade diameter", "190 mm"], ["Maximum cutting depth", "55 mm"], ["Rated speed", "7200 r/min"], ["Rated voltage", "220V"], ["Rated frequency", "50Hz"], ["Net weight", "3.5 kg"]])
  },
  "40": {
    title: "KFT-K190 2800W AC Brushless Wall Slotting Machine",
    model: "KFT-K190",
    summary: "A historical KFT-K190 listing for controlled wall channels in concrete, brick, stone and marble.",
    productIntroduction: "This historical listing refers to KFT-K190, a 2800W AC brushless wall slotting machine. The final blade, voltage, plug and package must be confirmed before order approval.",
    performance: "The supplied data lists a 190 mm blade, up to 55 mm cutting depth and 7200 r/min.",
    applications: ["Concealed electrical cable channels", "Pipe and conduit routing", "Masonry renovation", "Building services installation"],
    features: [...commonAdvantages, "190 mm blade format with up to 55 mm listed cutting depth."],
    specifications: specs([["Rated power", "2800W"], ["Blade diameter", "190 mm"], ["Maximum cutting depth", "55 mm"], ["Rated speed", "7200 r/min"], ["Rated voltage", "220V"], ["Rated frequency", "50Hz"], ["Net weight", "3.5 kg"]])
  },
  ACBrushlesswallpolishingmachine: {
    title: "KFT-W215 1000W Variable-Speed AC Brushless Wall Polishing Machine",
    model: "KFT-W215",
    summary: "A 1000W variable-speed AC brushless wall polishing machine for sanding, leveling and surface preparation on concrete, gypsum board and brick walls.",
    productIntroduction: "KFT-W215 is a variable-speed AC brushless wall polishing machine for renovation, decoration and maintenance work. It is intended for wall sanding, leveling, old-coating removal and putty-layer trimming on the stated materials. Confirm voltage, plug, sanding consumables and final accessories before quotation.",
    performance: "Variable speed from 900-2300 r/min supports surface-preparation work across different wall conditions. The supplied material describes low-vibration control, an aluminium alloy extendable pole, LED light strip, brushless self-suction and auto-leveling for the listed configuration.",
    applications: ["Concrete wall surface preparation", "Gypsum board sanding", "Putty layer trimming", "Old coating removal"],
    features: [...commonAdvantages, "Variable speed from 900-2300 r/min.", "215 mm grinding and sanding disc format.", "Aluminium alloy extendable pole, LED light strip, self-suction and auto-leveling listed for the supplied configuration."],
    specifications: specs([["Rated power", "1000W"], ["Grinding disc diameter", "215 mm"], ["Sanding disc diameter", "215 mm"], ["Rated speed", "900-2300 r/min"], ["Rated voltage", "220V"], ["Rated frequency", "50Hz"], ["Net weight", "2.4 kg"]])
  },
  ACBrushlesscoldcuttingsaw: {
    title: "KFT-L190 2200W AC Brushless Cold Cutting Saw",
    model: "KFT-L190",
    summary: "A 2200W AC brushless cold cutting saw for steel bar, steel pipe and alloy profile cutting in fabrication, installation and maintenance work.",
    productIntroduction: "KFT-L190 is an AC brushless cold cutting saw for metal fabrication, construction and manufacturing work. It is intended for cutting steel bar, steel pipe and alloy profiles where a low-heat cutting process is required. Confirm material grade, blade selection, voltage and safety requirements before ordering.",
    performance: "The supplied material lists a 190 mm blade, up to 32 mm cutting depth and 2100 r/min. It describes a low-vibration, low-heat cutting approach for the stated material applications.",
    applications: ["Steel structure fabrication", "Pipe installation", "Workshop metal cutting", "Mechanical maintenance"],
    features: [...commonAdvantages, "Rear switch configuration.", "190 mm blade format with up to 32 mm listed cutting depth."],
    specifications: specs([["Rated power", "2200W"], ["Blade diameter", "190 mm"], ["Maximum cutting depth", "32 mm"], ["Rated speed", "2100 r/min"], ["Switch position", "Rear switch"], ["Rated voltage", "220V"], ["Rated frequency", "50Hz"]])
  },
  ACBrushlesswaterdrillingrig: {
    title: "KFT-S218 6000W AC Brushless Water Drilling Rig",
    model: "KFT-S218",
    summary: "A 6000W AC brushless water drilling rig for drilling concrete, brick, stone and ceramic tile in construction, installation and municipal work.",
    productIntroduction: "KFT-S218 is an AC brushless water drilling rig for construction, renovation and municipal drilling tasks. The supplied record lists concrete, brick, stone and ceramic tile applications for utilities, air-conditioning, pipeline, ventilation and fire-protection installation. Confirm bit, wet or dry configuration, voltage and final accessories before quotation.",
    performance: "The supplied technical data lists a 218 mm drilling diameter and 2200 r/min. It describes three-speed adjustment, water cooling for temperature and dust management, plus wet and dry drilling capability with overload protection for the listed configuration.",
    applications: ["Utility and pipe opening work", "Air-conditioning installation", "Ventilation and fire-protection installation", "Concrete and masonry drilling"],
    features: [...commonAdvantages, "Three-speed adjustment listed for the supplied configuration.", "Wet and dry drilling capability with overload protection described in the source material."],
    specifications: specs([["Rated power", "6000W"], ["Maximum drilling diameter", "218 mm"], ["Rated speed", "2200 r/min"], ["Speed adjustment", "3-speed adjustment"], ["Rated voltage", "220V"], ["Rated frequency", "50Hz"], ["Net weight", "16 kg"]])
  },
  brushlessannularcutter: {
    title: "KFT-Y370 Large-Diameter Ring Saw Cutting Equipment",
    model: "KFT-Y370",
    category: "Concrete Cutting Tools",
    categorySlug: "concrete-cutting-tools",
    summary: "A historical KFT-Y370 large-diameter ring saw-style cutting equipment record pending final product-category, blade and safety-configuration confirmation.",
    productIntroduction: "The historical KFT-Y370 source shows a large-diameter saw-blade-style machine, while its legacy wording refers to an annular cutter. Cowin Supply is treating this as a category-confirmation record and will not present it as a magnetic drill, conventional annular cutter or fully specified product until the final equipment type, blade range and safety configuration are verified.",
    features: ["Product category and English naming are pending supplier confirmation.", "Blade range, safety configuration, voltage and accessory package require confirmation before quotation."],
    specifications: [],
    verified: false
  }
};

export function getVerifiedTechnicalProductData(item) {
  return VERIFIED_PRODUCT_TECHNICAL_DATA[item?.slug] || null;
}
