# Product Audit Before Rebuild

Generated: 2026-08-08 (Asia/Shanghai)  
Scope: current repository product fallback records; production records are normalized by the same migration when read.

## Findings

- Identified product records: **18**.
- Each record has a legacy product image path; none has a verified, structured specification set.
- Historical titles include spelling errors, keyword repetition, incompatible classifications and encoding corruption. These are being replaced in the display layer while their existing product slugs remain unchanged.
- `KFT-K190` occurs in two historical records (`CuttingMachine` and `40`). Both records are retained. The duplicate needs a supplier-side confirmation before either record can be merged or retired.
- Some legacy rich text contains technical claims that conflict with its own title. Those values are intentionally not exposed as verified parameters or indexed data.

| Product ID | Current name | Unified display name | Model | Current category | New category | Current URL | Real structured parameters | Main image | Missing / action | Manual confirmation |
|---|---|---|---|---|---|---|---|---|---|---|
| product-kft-q450brushlessjigsaw | KFT-Q450 800W AC Brushless Jig Saw | KFT-Q450 800W AC Brushless Jig Saw | KFT-Q450 | Brushless Angle Grinder | Jig Saws & Curve Saws | /product/KFT-Q450BrushlessJigSaw.html | No | Yes | verified parameters, gallery | Yes |
| product-6000wsolttingmachine | 6000W Industrial Heavy Duty AC Brushless Wall Chaser... | AC Brushless Wall Chaser (6000W Listing) | — | Brushless Angle Grinder | Wall Chasers | /product/6000wsolttingmachine.html | No | Yes | model and conflicting power/depth claims | Yes |
| product-heavycuttingmachine | 5500W Industrial AC Brushless Wall Chaser... | AC Brushless Wall Chaser (5500W Listing) | — | Brushless Angle Grinder | Wall Chasers | /product/HeavyCuttingMachine.html | No | Yes | model and conflicting technical claims | Yes |
| product-cuttingmachine | Industrial AC Brushless Wall Slotting Machine 2800W... | KFT-K190 AC Brushless Wall Slotting Machine (2800W) | KFT-K190 | Brushless Angle Grinder | Wall Chasers | /product/CuttingMachine.html | No | Yes | verified parameters; duplicate-model review | Yes |
| product-lasermeasuringdevicwithmultifunction | Handheld Laser Measuring Device... | Handheld Laser Distance Meter | — | diastimeter | Laser Distance Meters | /product/LaserMeasuringDevicwithMultiFunction.html | No | Yes | range, accuracy, laser class | Yes |
| product-measuringtapewithdigitaldisplay | 3-in-1 Laser Measuring Tape... | 3-in-1 Laser Measuring Tape (40m/60m Listing) | — | diastimeter | Laser Measuring Tapes | /product/MeasuringTapewithDigitalDisplay.html | No | Yes | exact range variant and accuracy | Yes |
| product-screwdriverforelectronics | Handheld Precision Power Screwdriver... | Handheld Precision Electric Screwdriver | — | diastimeter | Electric Screwdrivers | /product/ScrewdriverforElectronics.html | No | Yes | torque, bit set, battery | Yes |
| product-rechargeablebrushlessanglegrinder | Rechargeable Brushless Angle Grinder... | Rechargeable Brushless Angle Grinder | — | Brushless Lithium Battery | Angle Grinders | /product/RechargeableBrushlessAngleGrinder.html | No | Yes | disc, voltage, battery | Yes |
| product-brushlesslithiumioncordlessdrill | Professional Brushless Lithium-Ion Cordless Drill... | Brushless Lithium-Ion Cordless Drill | — | Brushless Lithium Battery | Cordless Drills | /product/BrushlessLithiumIonCordlessDrill.html | No | Yes | chuck, torque, battery | Yes |
| product-brushlesslithium | Cordless Brushless Lithium Battery Drill... | Cordless Brushless Lithium Battery Drill | — | Brushless Lithium Battery | Cordless Drills | /product/BrushlessLithium.html | No | Yes | model, chuck, torque, battery | Yes |
| product-acbrushlesscurvesaw | AC Brushless curve saw China manufacure... | AC Brushless Curve Saw | — | Brushless Angle Grinder | Jig Saws & Curve Saws | /product/ACBrushlesscurvesaw.html | No | Yes | model and cutting capacity | Yes |
| product-acbrushlesswallpolishingmachine | High Efficiency AC Brushless wall polishing machine | KFT-W215 AC Brushless Wall Polishing Machine | KFT-W215 | Brushless Angle Grinder | Wall Polishing Machines | /product/ACBrushlesswallpolishingmachine.html | No | Yes | supplier-record parameters must be confirmed | Yes |
| product-acbrushlesscoldcuttingsaw | AC Brushless cold cutting saw China maufacture | AC Brushless Cold Cutting Saw | — | Brushless Angle Grinder | Cold Cutting Saws | /product/ACBrushlesscoldcuttingsaw.html | No | Yes | model and cutting capacity | Yes |
| product-brushlessannularcutter | Industry first zero calibration brushless annular cutter | KFT-Y370 Brushless Annular Cutter | KFT-Y370 | Brushless Angle Grinder | Annular Cutters / Magnetic Drills | /product/brushlessannularcutter.html | No | Yes | product-type and supplier-record parameters conflict | Yes |
| product-acbrushlesswaterdrillingrig | Best sales AC Brushless water drilling rig | KFT-S218 AC Brushless Water Drilling Rig | KFT-S218 | Brushless Angle Grinder | Core Drills | /product/ACBrushlesswaterdrillingrig.html | No | Yes | supplier-record parameters must be confirmed | Yes |
| product-40 | Maufacture AC Brushless wall slotting machine | KFT-K190 AC Brushless Wall Slotting Machine (Historical Record) | KFT-K190 | Brushless Angle Grinder | Wall Chasers | /product/40.html | No | Yes | duplicate-model review and verified parameters | Yes |
| product-brushlessanglegrinde | High Performance Brushless Angle Grinder... | KRT-A125B Brushless Angle Grinder | KRT-A125B | Brushless Angle Grinder | Angle Grinders | /product/BrushlessAngleGrinde.html | No | Yes | supplier-record parameters must be confirmed | Yes |
| product-brushlessanglegrinder | Brushless Angle Grinder, High Torque... | KRT-A125 Brushless Angle Grinder | KRT-A125 | Brushless Angle Grinder | Angle Grinders | /product/BrushlessAngleGrinder.html | No | Yes | supplier-record parameters must be confirmed | Yes |

## Preservation rule

All listed product URLs are retained. No product slug is changed in this rebuild. Existing category URLs that are replaced by the canonical taxonomy receive one-hop permanent redirects in `URL_REDIRECT_MAP.csv`.
