"""
Run from backend directory:
    python -m scripts.seed_resources
"""

import httpx
import time

API = "http://localhost:8000"


def create_category(name: str, parent_id: int | None = None) -> int:
    res = httpx.post(f"{API}/api/categories", json={"name": name, "parent_id": parent_id, "sort_order": 0})
    res.raise_for_status()
    return res.json()["id"]


def create_block(title: str, body: str, category_id: int, tags: list[str]) -> int:
    import json
    res = httpx.post(f"{API}/api/blocks", json={
        "title": title,
        "body": body,
        "category_id": category_id,
        "tags": json.dumps(tags),
        "metadata_json": "{}",
    })
    res.raise_for_status()
    return res.json()["id"]


def seed():
    print("Seeding categories and resources...")

    # ==========================================
    # CATEGORIES
    # ==========================================

    gros_oeuvre = create_category("Gros Oeuvre")
    go_fondations = create_category("Fondations", gros_oeuvre)
    go_structure = create_category("Structure", gros_oeuvre)
    go_maconnerie = create_category("Maconnerie", gros_oeuvre)

    revetements = create_category("Revetements")
    rev_sols = create_category("Sols", revetements)
    rev_sols_pierre = create_category("Pierre Naturelle", rev_sols)
    rev_sols_carrelage = create_category("Carrelage", rev_sols)
    rev_sols_resine = create_category("Resine", rev_sols)
    rev_murs = create_category("Murs", revetements)
    rev_murs_enduit = create_category("Enduits", rev_murs)
    rev_murs_faience = create_category("Faience", rev_murs)
    rev_facades = create_category("Facades", revetements)
    rev_facades_monocouche = create_category("Monocouche", rev_facades)
    rev_facades_pierre = create_category("Pierre de Taille", rev_facades)

    peinture = create_category("Peinture")
    peinture_int = create_category("Interieure", peinture)
    peinture_ext = create_category("Exterieure", peinture)
    peinture_spec = create_category("Speciale", peinture)

    faux_plafonds = create_category("Faux Plafonds")
    fp_ba13 = create_category("BA13", faux_plafonds)
    fp_dalles = create_category("Dalles Minerales", faux_plafonds)
    fp_metal = create_category("Lames Metalliques", faux_plafonds)

    menuiserie = create_category("Menuiserie")
    men_bois = create_category("Bois", menuiserie)
    men_alu = create_category("Aluminium", menuiserie)
    men_metal = create_category("Metallique", menuiserie)

    plomberie = create_category("Plomberie Sanitaire")
    plomb_appareils = create_category("Appareils Sanitaires", plomberie)
    plomb_robinet = create_category("Robinetterie", plomberie)
    plomb_tuyau = create_category("Tuyauterie", plomberie)

    electricite = create_category("Electricite")
    elec_cf = create_category("Courant Fort", electricite)
    elec_cfaible = create_category("Courant Faible", electricite)
    elec_eclairage = create_category("Eclairage", electricite)

    cvc = create_category("CVC")
    cvc_clim = create_category("Climatisation", cvc)
    cvc_vent = create_category("Ventilation", cvc)

    etancheite = create_category("Etancheite")
    etanch_terrasse = create_category("Terrasses", etancheite)
    etanch_soussol = create_category("Sous-Sol", etancheite)

    vrd = create_category("VRD")
    vrd_voirie = create_category("Voirie", vrd)
    vrd_assainissement = create_category("Assainissement", vrd)
    vrd_espaces_verts = create_category("Espaces Verts", vrd)

    dev_durable = create_category("Developpement Durable")
    dd_isolation = create_category("Isolation Thermique", dev_durable)
    dd_energie = create_category("Energie Renouvelable", dev_durable)
    dd_eau = create_category("Gestion des Eaux", dev_durable)
    dd_materiaux = create_category("Materiaux Ecologiques", dev_durable)

    securite = create_category("Securite Incendie")
    sec_detection = create_category("Detection", securite)
    sec_extinction = create_category("Extinction", securite)
    sec_compartiment = create_category("Compartimentage", securite)
    sec_desenfumage = create_category("Desenfumage", securite)
    sec_signalisation = create_category("Signalisation", securite)

    print("Categories created.")

    # ==========================================
    # CONTENT BLOCKS
    # ==========================================

    # --- GROS OEUVRE ---

    create_block(
        "Beton arme B25 (25 MPa)",
        "Beton arme dose a 350 kg/m3 de ciment CPJ45, conforme a la norme NM 10.1.008. "
        "Resistance caracteristique a la compression a 28 jours: fc28 = 25 MPa. "
        "Granulats concasses 5/15 et 15/25 laves et calibres. Sable de riviere 0/5 propre. "
        "Rapport E/C inferieur a 0.55. Adjuvant plastifiant pour maniabilite. "
        "Mise en oeuvre par vibration systematique. Enrobage minimum des armatures: 3 cm en fondation, 2.5 cm en elevation. "
        "Cure du beton pendant 7 jours minimum.",
        go_structure,
        ["beton", "structure", "B25", "fondation", "elevation"]
    )

    create_block(
        "Beton arme B30 (30 MPa)",
        "Beton haute performance dose a 400 kg/m3 de ciment CPA55 ou CPJ45. "
        "Resistance caracteristique: fc28 = 30 MPa. Utilise pour elements fortement sollicites: "
        "poutres de grande portee, voiles de contreventement, dalles de grandes surfaces. "
        "Controle par essais sur eprouvettes cylindriques 16x32. "
        "Granulats concasses 5/15 et 15/25. Adjuvant superplastifiant. "
        "Affaissement au cone d'Abrams: 8-12 cm.",
        go_structure,
        ["beton", "structure", "B30", "haute performance"]
    )

    create_block(
        "Agglos creux 20x20x50",
        "Maconnerie en agglomeres creux de 20 cm d'epaisseur, conformes a la norme NM 10.1.009. "
        "Resistance a l'ecrasement minimale: 40 bars. "
        "Montage au mortier de ciment dose a 300 kg/m3, joints horizontaux et verticaux de 1 a 1.5 cm. "
        "Chainages horizontaux et verticaux en beton arme selon reglement parasismique RPS 2000/2011. "
        "Raidisseurs verticaux tous les 3 m maximum.",
        go_maconnerie,
        ["maconnerie", "agglos", "murs", "cloison"]
    )

    create_block(
        "Agglos creux 10x20x50 (cloisons)",
        "Cloisons de distribution en agglomeres creux de 10 cm d'epaisseur. "
        "Resistance minimale: 25 bars. Montage au mortier dose a 250 kg/m3. "
        "Joints reguliers de 1 cm. Enduit ciment sur les deux faces avant finition. "
        "Hauteur maximale sans raidisseur: 3 m.",
        go_maconnerie,
        ["maconnerie", "cloison", "distribution", "agglos"]
    )

    create_block(
        "Fondation en semelles isolees",
        "Semelles isolees en beton arme B25, dimensionnees selon etude geotechnique et descente de charges. "
        "Beton de proprete ep. 5 cm en fond de fouille. "
        "Armatures en acier HA Fe E500, enrobage minimum 5 cm. "
        "Profondeur d'assise minimum: 1.00 m sous terrain naturel. "
        "Amorces poteaux avec attentes conformes aux plans de ferraillage.",
        go_fondations,
        ["fondation", "semelle", "infrastructure", "beton"]
    )

    # --- REVETEMENTS SOLS ---

    create_block(
        "Granit poli gris 60x60 ep. 2cm",
        "Revetement de sol en granit naturel poli, teinte gris uniforme, format 60x60 cm, epaisseur 2 cm. "
        "Pose collee sur chape de mortier bien dressee, colle speciale pierre naturelle a double encollage. "
        "Joints de 2 mm au coulis de ciment blanc ou ton pierre. "
        "Traitement hydrofuge et oleofuge apres pose. "
        "Tolerance de planeite: 2 mm sous regle de 2 m. "
        "Plinthes assorties hauteur 10 cm. Finition polie miroir.",
        rev_sols_pierre,
        ["granit", "sol", "pierre", "hall", "poli"]
    )

    create_block(
        "Marbre blanc Carrare 40x40 ep. 2cm",
        "Revetement de sol en marbre blanc de Carrare, format 40x40 cm, epaisseur 2 cm. "
        "Veinure discrete et reguliere. Finition polie brillante. "
        "Pose collee sur chape dressee. Colle blanche speciale marbre. "
        "Joints de 1.5 mm au coulis blanc. "
        "Cristallisation mecanique apres pose pour brillance optimale. "
        "Protection par impregnation hydro-oleofuge incolore. "
        "Usage: halls d'honneur, espaces de prestige.",
        rev_sols_pierre,
        ["marbre", "sol", "pierre", "prestige", "blanc"]
    )

    create_block(
        "Carrelage gres cerame 60x60 rectifie",
        "Carrelage en gres cerame pleine masse, format 60x60 cm rectifie. "
        "Classement UPEC: U4 P4s E3 C2. Resistance a l'usure: PEI V. "
        "Resistance au glissement: R10 (locaux secs), R11 (locaux humides). "
        "Pose collee au peigne crante 10 mm, double encollage pour format > 45 cm. "
        "Joints de 2 mm, coulis epoxy pour locaux humides. "
        "Coloris au choix de l'architecte dans la gamme du fabricant.",
        rev_sols_carrelage,
        ["carrelage", "gres cerame", "sol", "rectifie"]
    )

    create_block(
        "Carrelage gres cerame 30x30 antiderapant",
        "Carrelage en gres cerame emaille antiderapant, format 30x30 cm. "
        "Classement UPEC: U4 P3 E3 C2. Surface structuree antiderapante R11/B. "
        "Conforme aux normes d'accessibilite PMR. "
        "Usage: sanitaires, cuisines, locaux techniques, circulations exterieures couvertes. "
        "Pose collee sur chape avec pente vers siphon (1.5% minimum en locaux humides). "
        "Joints de 3 mm, coulis epoxy.",
        rev_sols_carrelage,
        ["carrelage", "antiderapant", "sanitaire", "humide"]
    )

    create_block(
        "Resine epoxy autolissante",
        "Revetement de sol en resine epoxy bicomposant autolissante, epaisseur 2-3 mm. "
        "Application sur support beton parfaitement prepare (grenaillage ou ponçage). "
        "Primaire d'accrochage epoxy. Couche de corps autolissante. Finition satinee. "
        "Resistance chimique aux produits de nettoyage courants. "
        "Classement au feu: Bfl-s1. "
        "Usage: laboratoires, salles blanches, locaux techniques. "
        "Coloris RAL au choix de l'architecte.",
        rev_sols_resine,
        ["resine", "epoxy", "sol", "laboratoire", "technique"]
    )

    # --- REVETEMENTS MURS ---

    create_block(
        "Enduit ciment lisse interieur",
        "Enduit interieur au mortier de ciment CPJ35, en trois couches: "
        "gobetis d'accrochage dose a 500 kg/m3, corps d'enduit dose a 350 kg/m3, "
        "couche de finition lissee dose a 300 kg/m3. "
        "Epaisseur totale: 15 a 20 mm. "
        "Planeite: 5 mm sous regle de 2 m. "
        "Aretes vives protegees par baguettes d'angle. "
        "Cure par humidification pendant 48h.",
        rev_murs_enduit,
        ["enduit", "ciment", "interieur", "murs"]
    )

    create_block(
        "Faience murale 20x30 blanc brillant",
        "Revetement mural en faience emaillee blanche brillante, format 20x30 cm. "
        "Pose collee sur enduit ciment dresse, colle C2 pour locaux humides. "
        "Joints de 2 mm au coulis blanc antibacterien. "
        "Hauteur de pose: toute hauteur en sanitaires, 1.60 m au-dessus des plans de travail en cuisines. "
        "Baguettes de finition en aluminium anodise aux aretes et angles sortants. "
        "Classement: EB+ privatif, EC collectif.",
        rev_murs_faience,
        ["faience", "murs", "sanitaire", "cuisine", "blanc"]
    )

    # --- FACADES ---

    create_block(
        "Enduit monocouche gratte ton pierre",
        "Enduit de facade monocouche OC3 (selon NF DTU 26.1), teinte pierre naturelle. "
        "Application mecanique par projection, epaisseur 12-15 mm. "
        "Finition grattee a la taloche cloutee apres tirage a la regle. "
        "Traitement des points singuliers: angles avec profiles PVC, "
        "joints de fractionnement tous les 8 m maximum et a chaque changement de support. "
        "Gobetis d'accrochage prealable sur beton lisse. "
        "Delai de recouvrement entre les bandes: frais sur frais.",
        rev_facades_monocouche,
        ["facade", "monocouche", "enduit", "exterieur"]
    )

    create_block(
        "Pierre de taille calcaire 40x20x5",
        "Revetement de facade en pierre calcaire naturelle locale, format 40x20 cm, epaisseur 5 cm. "
        "Finition bouchardee ou adoucie selon indications de l'architecte. "
        "Fixation par pattes en acier inoxydable sur structure porteuse, avec lame d'air ventilee de 3 cm. "
        "Isolation thermique par l'exterieur en laine de roche ep. 5 cm derriere la lame d'air. "
        "Joints ouverts de 8 mm ou joints au mastic polyurethane teinte pierre.",
        rev_facades_pierre,
        ["facade", "pierre", "calcaire", "ventilee"]
    )

    # --- PEINTURE ---

    create_block(
        "Peinture vinylique mate interieure",
        "Peinture vinylique mate de qualite superieure pour murs et plafonds interieurs. "
        "Preparation du support: rebouchage des imperfections, ponçage, depoussierage. "
        "Application d'une couche d'impression fixante. "
        "Deux couches de finition vinylique mate, application au rouleau ou pistolet airless. "
        "Rendement: 8-10 m2/litre par couche. "
        "Teinte blanche (RAL 9010) ou coloris au choix de l'architecte. "
        "Classement COV: A+.",
        peinture_int,
        ["peinture", "vinylique", "interieur", "mate", "murs", "plafond"]
    )

    create_block(
        "Peinture glycerophtalique satinee (boiseries)",
        "Peinture glycerophtalique satinee pour menuiseries bois et metalliques interieures. "
        "Preparation: ponçage, degraissage, application de mastic aux raccords. "
        "Sous-couche primaire antirouille pour metal ou impression bois. "
        "Deux couches de finition glycero satinee, application a la brosse et au rouleau laqueur. "
        "Aspect tendu et lisse. Lessivable. "
        "Usage: portes, huisseries, plinthes, mains courantes.",
        peinture_int,
        ["peinture", "glycero", "satinee", "boiserie", "menuiserie"]
    )

    create_block(
        "Peinture exterieure acrylique (facade)",
        "Peinture de facade acrylique en phase aqueuse, aspect mat ou velours. "
        "Microporeux, hydrofuge, permeable a la vapeur d'eau. "
        "Resistance aux UV et aux intemepries (classement D3). "
        "Application sur enduit monocouche apres delai de sechage minimum 28 jours. "
        "Primaire regulateur de fond, puis deux couches de finition. "
        "Coloris selon nuancier facade, teintes claires recommandees.",
        peinture_ext,
        ["peinture", "acrylique", "facade", "exterieur"]
    )

    create_block(
        "Peinture intumescente coupe-feu",
        "Peinture intumescente pour protection des structures metalliques au feu. "
        "Classement: stabilite au feu 1 heure (R60) ou 2 heures (R120) selon epaisseur. "
        "Application par pistolet airless apres primaire anticorrosion. "
        "Epaisseur seche selon abaque du fabricant en fonction du massivite du profil. "
        "Finition par peinture decorative compatible. "
        "PV d'essai et certification CSTB exiges.",
        peinture_spec,
        ["peinture", "intumescente", "coupe-feu", "structure", "metal", "securite"]
    )

    # --- FAUX PLAFONDS ---

    create_block(
        "Faux plafond BA13 sur ossature metallique",
        "Faux plafond en plaques de platre BA13 (12.5 mm) sur ossature metallique suspendue. "
        "Ossature primaire et secondaire en profiles galvanises, entraxe 60 cm. "
        "Suspentes tous les 1.20 m maximum, reglables. "
        "Joints traites a l'enduit et bande calicot, finition prete a peindre. "
        "Trappe de visite 60x60 aux emplacements des equipements techniques. "
        "Hauteur libre sous plafond selon plans. "
        "Variante hydrofuge (plaques vertes) pour locaux humides.",
        fp_ba13,
        ["faux plafond", "BA13", "platre", "ossature"]
    )

    create_block(
        "Faux plafond dalles minerales 60x60",
        "Faux plafond demontable en dalles de fibres minerales 60x60 cm, epaisseur 15 mm. "
        "Ossature apparente en T profile aluminium laque blanc. "
        "Performance acoustique: alpha-w >= 0.70 (classe C). "
        "Resistance a l'humidite: 95% HR (pour locaux humides). "
        "Reaction au feu: A2-s1,d0. "
        "Bord droit pour pose affleurante. "
        "Luminaires et bouches de ventilation integres dans la trame.",
        fp_dalles,
        ["faux plafond", "dalles", "mineral", "acoustique", "demontable"]
    )

    # --- MENUISERIE ALUMINIUM ---

    create_block(
        "Fenetre coulissante aluminium 2 vantaux",
        "Menuiserie coulissante en aluminium a rupture de pont thermique, 2 vantaux. "
        "Profiles aluminium 6060 T5, laquage polyester 25 microns teinte au choix (RAL). "
        "Vitrage double 4/16/4 mm, lame d'argon, verre clair trempe securit. "
        "Uw <= 2.0 W/m2.K. Classement AEV: A*4 E*7B V*C3. "
        "Quincaillerie: galets de roulement inox, cremone multipoint, poignee ergonomique. "
        "Joint peripherique EPDM. Drainage integre. "
        "Seuil a rupture thermique surbaisse pour accessibilite PMR.",
        men_alu,
        ["fenetre", "aluminium", "coulissante", "vitrage", "thermique"]
    )

    create_block(
        "Mur rideau aluminium VEC",
        "Mur rideau a ossature aluminium en vitrage exterieur colle (VEC). "
        "Structure: montants et traverses aluminium section 50x130 mm, entraxe selon trame. "
        "Remplissage: double vitrage 6/16/6 mm a controle solaire, verre trempe exterieur. "
        "Facteur solaire g <= 0.35. Uw <= 1.8 W/m2.K. "
        "Silicone structurel certifie pour collage des vitrages. "
        "Joints d'etancheite entre elements. Dilatation absorbee par profiles a rupture. "
        "Avis Technique CSTB obligatoire.",
        men_alu,
        ["mur rideau", "aluminium", "VEC", "facade", "vitrage"]
    )

    # --- MENUISERIE BOIS ---

    create_block(
        "Porte isoplane interieure 90x210",
        "Porte interieure isoplane a ame alveolee, dimensions standard 90x210 cm. "
        "Parement en MDF 5 mm, finition stratifie ou pret a peindre. "
        "Huisserie en bois dur (chene ou hetre) ou cadre metallique a bancher. "
        "Quincaillerie: 3 paumelees 140 mm laiton ou inox, serrure a bec de cane, "
        "poignee sur rosace inox brosse. "
        "Joint peripherique acoustique en cas d'exigence Rw >= 32 dB. "
        "Jeu en feuillure: 3 mm. Jeu sous porte: 10 mm (ou seuil si acoustique).",
        men_bois,
        ["porte", "isoplane", "interieur", "bois"]
    )

    # --- MENUISERIE METALLIQUE ---

    create_block(
        "Porte coupe-feu CF 1h metallique",
        "Bloc-porte metallique coupe-feu 1 heure (EI60), simple vantail 90x210 cm. "
        "Ouvrant en tole d'acier 15/10 avec ame isolante en laine de roche. "
        "Huisserie en acier 20/10 a sceller ou a clipser. "
        "Ferme-porte hydraulique avec force reglable. "
        "Serrure antipanique (si sur issue de secours) conforme NF EN 1125. "
        "Joint intumescent peripherique. PV d'essai en laboratoire agree. "
        "Laquage epoxy-polyester RAL au choix. "
        "Signalisation 'Porte coupe-feu, maintenir fermee'.",
        men_metal,
        ["porte", "coupe-feu", "metallique", "securite", "CF1h"]
    )

    create_block(
        "Garde-corps metallique main courante inox",
        "Garde-corps en acier peint avec main courante en tube inox diametre 42 mm. "
        "Hauteur: 1.00 m minimum (1.20 m si hauteur de chute > 6 m). "
        "Montants en tube acier 40x40 mm, entraxe 1.50 m maximum. "
        "Remplissage en barreaudage vertical entraxe 11 cm (norme NF P01-012). "
        "Fixation en platine au sol ou en applique laterale par chevilles chimiques. "
        "Traitement anticorrosion: galvanisation a chaud + laquage polyester. "
        "Main courante continue, sans interruption aux angles.",
        men_metal,
        ["garde-corps", "metallique", "inox", "securite", "escalier"]
    )

    # --- PLOMBERIE ---

    create_block(
        "Lavabo ceramique blanc sur colonne",
        "Lavabo en ceramique sanitaire blanc, format 60x45 cm, sur colonne assortie. "
        "Trop-plein integre. Percage pour robinetterie monotrou. "
        "Fixation par vis inox et chevilles avec joints silicone. "
        "Evacuation en PVC diametre 32 mm avec siphon a culot demontable. "
        "Alimentation en cuivre ou multicouche avec robinets d'arret individuels. "
        "Conforme NF EN 14688.",
        plomb_appareils,
        ["lavabo", "ceramique", "sanitaire", "blanc"]
    )

    create_block(
        "WC a poser sortie horizontale + reservoir",
        "Cuvette WC en ceramique blanche a poser, sortie horizontale. "
        "Reservoir attenant double chasse 3/6 litres (economie d'eau). "
        "Abattant a fermeture ralentie. "
        "Fixation au sol par vis inox. Raccordement evacuation PVC diam. 100 mm. "
        "Alimentation en cuivre 12/14 avec robinet d'arret 1/4 de tour. "
        "Joint d'etancheite au sol en silicone sanitaire. "
        "Conforme NF EN 997.",
        plomb_appareils,
        ["WC", "ceramique", "sanitaire", "double chasse"]
    )

    create_block(
        "Tuyauterie PPR eau chaude/froide",
        "Reseau de distribution eau froide et eau chaude en tubes polypropylene (PPR) "
        "type 3 (PN20 pour eau chaude, PN16 pour eau froide). "
        "Assemblage par soudure par polyfusion (electrosoudage interdit). "
        "Calorifugeage des colonnes et distributions en mousse elastomere ep. 13 mm (ECS) et 9 mm (EF). "
        "Supportage par colliers isophoniques tous les 0.80 m. "
        "Vannes d'isolement a chaque derivation et pied de colonne. "
        "Essai d'etancheite a 1.5x pression de service pendant 2 heures.",
        plomb_tuyau,
        ["PPR", "tuyauterie", "eau", "plomberie"]
    )

    # --- ELECTRICITE ---

    create_block(
        "Appareillage encastre gamme superieure",
        "Appareillage electrique encastre, gamme superieure (type Legrand Mosaic ou equivalent). "
        "Mecanismes: interrupteurs 10A, prises 2P+T 16A, prises RJ45 cat.6. "
        "Plaques de finition coloris blanc ou aluminium selon localisation. "
        "Hauteur d'implantation: interrupteurs a 1.10 m, prises a 0.30 m (0.40 m en PMR). "
        "Prises plan de travail a 1.10 m. "
        "Boites d'encastrement BBC (basse consommation) avec systeme d'etancheite a l'air.",
        elec_cf,
        ["appareillage", "prise", "interrupteur", "encastre"]
    )

    create_block(
        "Eclairage LED encastre dalle 60x60",
        "Luminaire LED encastre dans faux plafond modulaire 60x60 cm. "
        "Puissance: 36-40W. Flux lumineux: 3600-4000 lm. "
        "Temperature de couleur: 4000K (blanc neutre). IRC >= 80. "
        "Diffuseur microprismatique anti-eblouissement UGR < 19 (conforme pour bureaux). "
        "Driver integre dimmable DALI. Duree de vie: 50 000 heures L80/B10. "
        "Classement electrique: Classe II. IP20 (IP44 en version milieux humides).",
        elec_eclairage,
        ["LED", "eclairage", "encastre", "dalle", "bureau"]
    )

    # --- CVC ---

    create_block(
        "Climatisation VRV/VRF multi-split",
        "Systeme de climatisation a debit de refrigerant variable (VRV/VRF). "
        "Unites exterieures modulaires sur terrasse technique (support anti-vibratile). "
        "Unites interieures: cassettes 4 voies encastrees dans faux plafond. "
        "Fluide frigorigene R32 (faible GWP). "
        "Puissance frigorifique: selon bilan thermique par local. "
        "Regulation individuelle par telecommande filaire dans chaque piece. "
        "Gestion centralisee par automate communicant (BACnet ou Modbus). "
        "COP >= 4.0 en mode froid, SCOP >= 4.5.",
        cvc_clim,
        ["climatisation", "VRV", "VRF", "split", "cassette"]
    )

    create_block(
        "Ventilation mecanique double flux",
        "Systeme de ventilation mecanique double flux avec echangeur de chaleur. "
        "Centrale de traitement d'air sur terrasse technique ou local technique. "
        "Rendement de l'echangeur thermique >= 80%. "
        "Filtration: F7 sur air neuf, G4 sur air extrait. "
        "Reseau de gaines en tole galvanisee avec isolation thermique et acoustique. "
        "Diffusion par bouches auto-reglables ou diffuseurs plafonniers. "
        "Debits conformes au reglement general de construction (arrete ventilation). "
        "Niveau sonore: NR 35 en bureaux, NR 30 en salles de cours.",
        cvc_vent,
        ["ventilation", "double flux", "VMC", "CTA"]
    )

    # --- ETANCHEITE ---

    create_block(
        "Etancheite bicouche elastomere terrasse inaccessible",
        "Complexe d'etancheite bicouche en membranes bitumineuses SBS elastomere. "
        "Sur support beton avec forme de pente (1.5% minimum). "
        "Couches: primaire d'impregnation EIF, pare-vapeur, isolant thermique PSE ep. 5 cm, "
        "premiere couche d'etancheite EAC soudee, deuxieme couche avec autoprotection minerale. "
        "Releves d'etancheite de 15 cm minimum au-dessus de la protection. "
        "Evacuation des eaux pluviales par trop-pleins et descentes EP. "
        "Garantie decennale avec assurance. PV de classement FIT.",
        etanch_terrasse,
        ["etancheite", "terrasse", "bicouche", "bitume", "elastomere"]
    )

    # --- VRD ---

    create_block(
        "Voirie en enrobe bicouche",
        "Chaussee en enrobe bitumineux bicouche: "
        "couche de base en grave bitume 0/20 ep. 8 cm, "
        "couche de roulement en beton bitumineux 0/10 ep. 5 cm. "
        "Fondation en tout-venant 0/40 compacte ep. 20 cm. "
        "Forme en remblai compacte a 95% OPM. "
        "Bordures T2 en beton prefabrique sur semelle beton. "
        "Pente transversale: 2.5% vers caniveaux. "
        "Assainissement par caniveaux grille et regards de collecte.",
        vrd_voirie,
        ["voirie", "enrobe", "bitume", "chaussee", "exterieur"]
    )

    create_block(
        "Reseau assainissement PVC CR8",
        "Reseau d'assainissement enterre en PVC compact CR8 (rigidite SN8). "
        "Diametres selon calcul hydraulique: collecteurs 200 a 400 mm. "
        "Pente minimum: 1% pour diametre 200, 0.5% pour diametre 300+. "
        "Lit de pose et enrobage en sable 0/4 sur 10 cm. "
        "Regards de visite en beton prefabrique tous les 30 m et a chaque changement de direction. "
        "Tampon fonte classe C250 (voirie legere) ou D400 (voirie lourde). "
        "Essai d'etancheite a l'air ou a l'eau avant remblaiement.",
        vrd_assainissement,
        ["assainissement", "PVC", "regard", "reseau", "eaux usees"]
    )

    # --- DEVELOPPEMENT DURABLE ---

    create_block(
        "Isolation thermique par l'exterieur (ITE) laine de roche",
        "Isolation thermique des facades par l'exterieur en panneaux de laine de roche rigide ep. 10 cm. "
        "Resistance thermique R >= 2.85 m2.K/W. Lambda = 0.035 W/m.K. "
        "Fixation par colle-chevillage. Armature en treillis fibre de verre marouflee dans sous-enduit. "
        "Finition par enduit mince organique ou mineral selon choix architectural. "
        "Traitement des points singuliers: tableaux, appuis, acroteres, joints de dilatation. "
        "Performance: reduction des deperditions murales de 70%. Suppression des ponts thermiques courants.",
        dd_isolation,
        ["isolation", "ITE", "laine de roche", "thermique", "facade"]
    )

    create_block(
        "Panneaux photovoltaiques en toiture",
        "Installation photovoltaique en toiture-terrasse, panneaux monocristallins haut rendement. "
        "Puissance unitaire: 400-450 Wc par panneau. Rendement >= 21%. "
        "Structure support en aluminium sur plots beton (sans perforation de l'etancheite). "
        "Orientation Sud, inclinaison 25-30 degres. "
        "Onduleurs string ou micro-onduleurs selon configuration. "
        "Raccordement au TGBT avec comptage de production. "
        "Autoconsommation avec injection du surplus (selon reglementation ONE). "
        "Dimensionnement: couverture de 30% minimum des besoins electriques du batiment.",
        dd_energie,
        ["photovoltaique", "solaire", "energie", "renouvelable", "toiture"]
    )

    create_block(
        "Recuperation des eaux pluviales",
        "Systeme de recuperation et stockage des eaux pluviales de toiture. "
        "Cuve enterree en beton ou PEHD, volume selon surface de toiture et pluviometrie locale. "
        "Filtration en amont: degrilleur, filtre autonettoyant. "
        "Pompe de surpression avec gestion automatique (bascule sur reseau AEP si cuve vide). "
        "Usage: arrosage espaces verts, alimentation WC, nettoyage des sols. "
        "Reseau separe identifie 'eau non potable' (canalisation verte + pictogrammes). "
        "Trop-plein raccorde au reseau EP. "
        "Economie estimee: 40-50% de la consommation d'eau non potable.",
        dd_eau,
        ["eau pluviale", "recuperation", "cuve", "economie", "arrosage"]
    )

    create_block(
        "Beton bas carbone CEM III",
        "Utilisation de beton bas carbone a base de ciment CEM III/A (laitier de haut fourneau >= 50%). "
        "Reduction de l'empreinte carbone de 30-40% par rapport a un CEM I classique. "
        "Performances mecaniques equivalentes a 28 jours (B25 maintenu). "
        "Applicable aux elements non structuraux et fondations superficielles. "
        "Cure prolongee recommandee (decoffrage a 72h minimum). "
        "Fiche FDES disponible pour calcul de l'impact environnemental global du batiment.",
        dd_materiaux,
        ["beton", "bas carbone", "CEM III", "ecologique"]
    )

    # --- SECURITE INCENDIE ---

    create_block(
        "Systeme de detection incendie adressable",
        "Systeme de detection incendie (SDI) adressable conforme NF S 61-970. "
        "Centrale de mise en securite incendie (CMSI) de categorie A. "
        "Detecteurs optiques de fumee adressables dans tous les locaux et circulations. "
        "Detecteurs thermiques dans cuisines et locaux techniques. "
        "Declencheurs manuels (DM) a chaque sortie et dans les circulations (< 30 m entre 2 DM). "
        "Diffuseurs sonores (DS) et visuels (flash) pour alerte. "
        "Report d'alarme au poste de securite. "
        "Alimentation secourue (AES) avec autonomie 12h en veille + 5 min en alarme.",
        sec_detection,
        ["detection", "incendie", "SDI", "CMSI", "alarme"]
    )

    create_block(
        "Reseau d'extinction par RIA DN25/30",
        "Robinets d'Incendie Armes (RIA) DN 25/30 conformes NF EN 671-1. "
        "Implantation: tout point du batiment accessible a moins de 30 m d'un RIA (distance deployee). "
        "Devidoir a alimentation axiale, tuyau semi-rigide 30 m. "
        "Pression dynamique au RIA le plus defavorise: >= 2.5 bars. "
        "Alimentation par reseau surpresse ou bache + pompes (selon disponibilite reseau public). "
        "Signalisation par panneaux conformes NF EN ISO 7010. "
        "Verification annuelle par organisme agree.",
        sec_extinction,
        ["RIA", "extinction", "incendie", "reseau"]
    )

    create_block(
        "Extincteurs portatifs",
        "Extincteurs portatifs conformes NF EN 3: "
        "poudre ABC 6 kg (locaux generaux, circulations), "
        "CO2 5 kg (locaux electriques, informatiques), "
        "eau pulverisee + additif 6 L (bureaux). "
        "Implantation: 1 appareil pour 200 m2, distance maximale 15 m pour atteindre un extincteur. "
        "Fixation murale a 1.20 m (poignee de portage). "
        "Signalisation par panneau conforme. "
        "Verification annuelle + revision decennale (remplacement).",
        sec_extinction,
        ["extincteur", "incendie", "poudre", "CO2", "securite"]
    )

    create_block(
        "Compartimentage coupe-feu CF 1h",
        "Cloisonnement coupe-feu EI60 (1 heure) entre compartiments: "
        "cloisons en carreaux de platre plein ep. 10 cm, ou doubles parois BA13 sur ossature metallique "
        "avec laine minerale ep. 70 mm (PV de classement requis). "
        "Recoupement des circulations tous les 30 m par portes CF 1/2h a ferme-porte. "
        "Traitement des traversees de parois CF: fourreaux + calfeutrement coupe-feu "
        "(mastic intumescent ou manchons). "
        "Jonction plancher/cloison: bourrage laine de roche + joint coupe-feu. "
        "PV d'essai pour chaque configuration.",
        sec_compartiment,
        ["compartimentage", "coupe-feu", "cloison", "EI60", "incendie"]
    )

    create_block(
        "Desenfumage mecanique",
        "Systeme de desenfumage mecanique conforme IT 246 (ERP) ou Code du Travail. "
        "Extracteurs en toiture ou facade, debit selon calcul (1 m3/s pour 100 m2 minimum). "
        "Volets de desenfumage motorises (DAS CF 1h) dans les gaines. "
        "Amenees d'air naturelles ou mecaniques en partie basse. "
        "Declenchement automatique par la detection incendie (zone par zone). "
        "Commande manuelle au poste de securite. "
        "Ventilateurs certifies 400 degC/1h. "
        "Gaines en acier galvanise CF selon parcours.",
        sec_desenfumage,
        ["desenfumage", "mecanique", "extracteur", "volet", "incendie"]
    )

    create_block(
        "Signalisation et eclairage de securite",
        "Eclairage de securite conforme NF C 71-800 et NF EN 1838: "
        "blocs autonomes d'eclairage de securite (BAES) type permanent ou non permanent. "
        "Balisage des chemins d'evacuation: bloc a chaque changement de direction, "
        "a chaque sortie, et tous les 15 m dans les circulations. "
        "Blocs BAEH (Habitation) pour les circulations communes. "
        "Autonomie: 1 heure minimum (5h pour BAEH). "
        "Telecommande de mise au repos centralisee. "
        "Plans d'evacuation plastifies affiches a chaque niveau (format A3). "
        "Pictogrammes conformes NF EN ISO 7010 (fond vert, symbole blanc).",
        sec_signalisation,
        ["signalisation", "BAES", "eclairage securite", "evacuation", "incendie"]
    )

    print(f"Resources seeded successfully.")


if __name__ == "__main__":
    seed()