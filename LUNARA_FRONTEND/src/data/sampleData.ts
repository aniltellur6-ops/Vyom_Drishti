import { TiePoint, ExperimentRecord, BenchmarkMethod } from '../types';

export const LUNARA_ASSETS = {
  logoMark:
    'https://lh3.googleusercontent.com/aida/AEtjO1V6ZXNE7YyHgyNqW_vwHViIwll54QLgdWQGStGTdz6CLTc1038mPAZMPN20F3TOtwt5HCNkz19QQz7faz_MizFXvBLMnT5figo34Hts6Tt42Tup4h-PLVd7kOZ_pSsi7l7HliGLRQPWV2kVSpt1G-Sy8L4Gv2R8U7It5fB5z7KijPx66JaaozSxu21-r_GlcijuNeQBJWzVze2lbfPlu4BXXxQeh0nGlz8d-QRGiwdUAEgrRQxjn0EA5Q',
  // Low sun angle crater surface
  craterLowSun:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDBC6T8Q5_5PVcg3K9pDKtJbfpwWIQ0NmEUwB0mCAXKUU6jIq7TFsPTHQOXiW2a8zbb0JzT2FvZQrFatagsJcexdYQTgplsOi49GIkqOyilKth6juDvSYqaEtQiNdmRcsOyvjOOJpI9G-HCc5WJFXFLJXYbm-fOArhB9CUMyfBa02XrLXLM8Rb82MKly1M0K3UmLrVtJJ-zbezkEjmR_wZdQhppIOOLV_eLVyrqm4JP7GpnpIGDuet7',
  // Opposing solar angle crater
  craterOpposing:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuCKvdzXcEJz28zZymCwTeMBh9p0EvQzMvwxeNDrZGAga_2uKJcpajtgYaxm4FCfxjIvhhJ9tsWGZMR-AbDbwdEiUztWM2nb94VE88vspp4VBS3KJ15YrQ3srpRPw7e16bjCpma8-ZufCCZzZ22_3fh2ZTQTSZFtqOfSy6ma8v2iA97z0PkirbapfP7qdZJ9Pa_rnamCO8Lx5RRguZ27JBI4SZGwfIghotIa8lXVE1VvrIyVCFe4u9fc',
  // Dual viewport left photogrammetry
  viewportLeft:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuARqEfKEMrMaa3jLzEWY43p2OO9tvtydj0eH7OMYLn7TK1QOp4obQRutwSyqzLQ17t31S8p1uMObeZfJdQNXOyZ8cMwIqRSoKyK6ZKXhHL1n7wpTM19Bv4T-cbuE6eOCU2TWq3GU_nNlFAM6ISAfwBMiExj8FyMHyyb7rqRsM-25CY-dmQqB_5l_9gAzMSYn36ElbVN9k5TSPONve_3oU-DE9mpAvG73CDIK9k9BcJv26uVjoy7NjXx',
  // Dual viewport right matching crater
  viewportRight:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDiojRu7chkjmNN8kWJiWhSRreixgG85h4fNrrHHdQT42VzVBtAqC-s0la0FRrN4tSWuA8EDPQSHjAqvHx2DfzIy4oqpYVrtJnzhHKx2BJJbYSCoVzh7fV91gWVjGAXRp-cZmItnlbQgOcB1rMXdH-JNBC6DvmWURTQqGyVFfKzWcjokL_m7gILhDXNyblC8GoL-UGm6_n2cdyCl7hU1MtLyAYjYMeifGx1PVpq4QFzV9ggy0B92BZS',
  // 4-tile LROC Mosaic tiles
  tileP0450:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDykcZjBDaxJ14kVobY7x3Iltxg-ur3T7i9-PAxa1jssB_1zkIHLlUoatL4z28UYDRGz-3yHYg0NtZ8Jr_A0l4p3RTNoJMv25oeDcMuOlzPrQGExwoshzOf5mdg5-jT_XXm7d34KbdkfPOwesPrJr_KiVGLO8n51dt2IKMFc1ViojNEmST521HpNvHfZBgkyJgMkJpM4bjrTLgcLGUp3Yr1nx8Q8UU-iIO6ZWqw6zk2Q9qK1gbR5-P6',
  tileP3150:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuA-ObzxZjXPVbwqTw6_EOmP3TGU-e_5d1joOFjB3bA5-1fupmKXrriekNLQfTFHaw-ldBU_DHNHUl5LlkG4G90N4LjoL9BQY-gRLQjDKZWKA8n1ej_KVhCs0Ho4zIyj-bzL-d0OCruDLQSZcLftM5Bqo_G4JUYxzms66sTP8K2AHo2R69cArAtAg7UDwEfaB2ThJV7LGlnZ262JA_rF24DQXwJbXzR7dYbxp1CJBTn0-SIG7WPeZIcx',
  tileP1350:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuAqtrm6mzIpqwlU2qyJnlfEEWrJJS2X2exjybVsGCn7-vnTD5TO74VserN1BKUUbb71q3PQO-WbUZNd5C3gfX_9G89m8frW_s54waMgm5Yldf8ZHCiiUvkDtNXXA4V0CjhGz7whsPT00YhrfY9xaH8L0M4Ze5o5QI6aZ-wId9ywciTRN3pWX9L8ekEeLWHwCtENljydgSzwafnuWw3eZNptr_bv9BlbNymciQ9rswl8268QruTBqYKr',
  tileP2250:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDhWG__HAPM626Er9vMfq7vy9oE36ziM9M9DrJYzlNtq_HUSz4AfBwj0pYK8iGPOamD0i4jpnSG08jGF-hhod3vWHgFgYJhyGfjBOWpcBkKQuymwzNSiGNPGgd_k3lkGOqsLWk3BSD86s5OE2ltwr44KKRpQlLvU7gdJi42YMUQHDO_a1n9qwltGV84DYrZUYhbEmnoLGqMwHuqvy8ifTgd7jE15qu9K3RooWgmbdafVCJpi7UCUJfZ',
  // EXP-042 Manifest preview
  expOrbitPreview:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuCQC7HJ5i2fyRsThVjCg1WMawsqA8DXRNrw1eC_dI2LX0wW0YgGAiaM25mDZoKjLsGV4ESY4uLULfiJTwuhphWK9sdmEGr-2r-NPS37NBnJvTfw4eoakzQHzhKKDkR1_P2x5HGyvuiv-9IxwOVwMl45_gBVXro7pJz6ZZKGgen3NVSM27_o0DrSsVwFLsz2MLpTSXfkFPcQO2BPfMI33MI4jd2fdUrV0xuYv03GrGRalUBGdB55alpw',
  // Benchmark comparison images
  benchSift:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBBodHzPTQQzQMHsKXhozFj2VvbjA3alRjSx7QD0EFombZf-fjQDISjOL11lhpTYFcEP8TtSNLeO1lBbQzW9IJC-ZJhq1B8x0-S244u8bnUmuuIZ5Ki1tTAF3b1mPXShQ30N_TuancnqIG2lwd0ty5TlJKAe04cE80RSmQNl89xjjru4tBULWKWiEiN-8rGfQ9dpbIOu9LPkQtAcw9qFUARuLhHBCtsN3xGFsOQGZWC22oKfetW7JYM',
  benchRift:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuC_9heAvNL_vpNtRXWq9--7o6vXlkAD7dGvF6hZxChbF43WWJ8Gxkxx57J8wMN5X2X9BESk-BBEVjcrm5mPIrzGMdPf3nhEMTWT-hNO5RHVj2z-L4-aiRN3zMHyrd_gAkJEbRk7eEPnEteyRpgRrj2bfoSNeRlEpYRgBimHxi6tpEG49b2tMOvIj9DISGI3X3S56u-0Np7iGxWTvf-jdnbMj4wTM0oJtCbpobZCcGZ40qrpnoGYzRND',
  benchSuperPoint:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuD-T81_R3PzSjNjh8tFso7j-62mhW6ZlIAN6S2f7XyE20qi7aAVEyiCYPgvwFUC5mrJJQd-FI9bqSiYy8SLCqeET-831tB0oxocba7vb4F3tZ1VDwNrCEOQFYwcs292kP9i8NfvJTXqBQLvvCZuZsLV3_DAYvlPJHA4fVXrt1JPn5di0KpwcoJQ_-c_XbcINA3dJlCfI0WjEaYNPlrz-uBBI7q5KNDWToIh0-tNLFUyT240IRZoWIXx',
  benchLoFTR:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuAoK69Nh8gKUzvULLgohr6wOnihX6R44GOhXLBPjhy1DdBJRCBKsSrlOxMSRa_jxKGYxjAFZHDKRrBvo3CiHoXQ7i1hMeEi5H22QuvDUyjx1UHyk8RLnPxOx551x5GGUGBL65oQL9rRjCGxfSXnrPOFUA9-4GAGcZEr0rX43m-0121z6qOSwVVv1n9zNYh_4AKdBItcofuu6MIsDHEeb37EmV2zf13GeloAY6BSw0-2ZQBF-eCM39wy',
  // High sun split view
  splitA:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDpCdHKo-lx-dnrt2_uBxDfu6BhBQWY1P2PxLGVUchtjfJ9JudY2mENY8cSOsk2rvdW0ajjQf3IpFSS5nAamZ7ee9p4jh1FTEKEdmM6_qRO1fNTi-u9Kuo64xF9YWwz5j6-pCKlDnFSyw9_7rWAwBd09PPT_HqIgMiWVt2RHQaMN4S9VGjfn5YSmOQEid4um5xam-NHmYkQ5tNRjjniz6LuQyKorgnChID3VqVaxnce7SaRpIxFp9d0',
  splitB:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDc2R83K4kqbx4KgGnftHFXDV9HxFuEhC7-LquTUO4bx2IooqzIDFnv0Yt8PWpGkJMygOJ1JKBgdtsAdT2dTo5ZzZy4x5T3mTyn3gAckgkprlgYCfiYSDNjAHOFFsMxueztHlRZR3XJN63OoCUMeA4kUbPwInNXEH2Dm1UKDpIeMqrL1rTYwlrw1xmSw-q1-a65lfH8ARGV3TdjGjPgJzT3R3SnfzLKKrPBT4CL_OzSnWEx84xV-A2a',
  // 4-quadrant assets
  q1Moving:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBEUWaX1xX2CKaVEVmpX3Sqc82V966WYbInf1aNk1vFC4K17Fcke6J-7sJktEcGM6shOe9YF6xpnYxCkA-PGbVP2L0yUXazNMXmVsgRGLFC1uWSyTXJVMnHPV45Sv3tAFoSN2RJE_V2MggHVHYY124AXBzOsXHJJqhs_o-P6XMaQJiUzY6NQl12RicNOXvscPlUKWRYdGvVYWGAV5f4le8Rq3bdJucuHGoEVK3cM1YXgP7UzYPoi8x-',
  q2Warped:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDeYYZfBTAaOPEFitJsDylJHvbp-6198CqM27aHO0X1uuU_VbO1BCI0MEQgEgiSNirtl1sXIx5dlAevwar6f3LWJfl97dhkabv2Xuv4m9dw8qKsnzyHIpfZxVLNyCF8z12s7K735nufb99NC6v2TDvRbw1NRwsnDBmsPgLcD3Ho1O2AQpIA-k7-SvRknG75ZH4CqEa5YQRRDsKwPln_ppmXb6MNeoMXkgA_W-6R47GxjOHrUt3L2_5w',
  q3Ref:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuAlM_WaMIod9S98IdjDrFl7JEfABvt9Lv6A_8kuQdvkMwQOiAUQOQuue7Txh_eXox0MQTrmS5WuQpbEbO9FfHH09t3VSrmM82NDBK-Y_i3BxCn6hJXet6X8jjRf0eRzniB-K3ONWo6Hwvps4tD3oCY1gWym00RQWumlrNEPpyh8wovEw4Bgf96q_Wa38A2YezyIENUNJEk8YApK0qUQlhTMAORGjo8enrq_QUx9-GnYcnwaMCPgQWYP',
  q4Checker:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDOV7KBcpmA4YwQOxRCuJuJjolYZ7vNiehRQ7ZkTwM5rgJXkHrnWZP-R7KQnMtCp9gOB21VMiYXd3KnOSzYMDT361nWQvgVJ8_07yYQHp6ozQrnddlZQH7NztFVbR__GBgrI9OTZZkrqYMcnGNjMGAJOhMZtaMDYmY76489oraOpH2PTrst9j_iHx9jrMf5g6nmD5y_hPl6HO0P8Or4YnuOmEHHJr3wU0vIkfXI4x59ELDVbWnGMGEZ',
};

export const SAMPLE_TIE_POINTS: TiePoint[] = [
  {
    id: 'PT_001',
    movingX: 4122.4,
    movingY: 8910.12,
    refX: 2061.2,
    refY: 4455.06,
    lat: "89°32'44.1\" S",
    lon: "132°04'12.0\" E",
    confidence: 0.984,
    residualError: 0.42,
    status: 'inlier',
  },
  {
    id: 'PT_002',
    movingX: 4180.15,
    movingY: 8944.3,
    refX: 2090.07,
    refY: 4472.15,
    lat: "89°32'45.3\" S",
    lon: "132°04'18.4\" E",
    confidence: 0.961,
    residualError: 0.68,
    status: 'inlier',
  },
  {
    id: 'PT_003',
    movingX: 4310.82,
    movingY: 9102.55,
    refX: 2155.41,
    refY: 4551.27,
    lat: "89°32'49.0\" S",
    lon: "132°04'38.9\" E",
    confidence: 0.942,
    residualError: 0.89,
    status: 'inlier',
  },
  {
    id: 'PT_004',
    movingX: 3980.12,
    movingY: 8540.2,
    refX: 2012.8,
    refY: 4310.1,
    lat: "89°32'31.1\" S",
    lon: "132°03'22.1\" E",
    confidence: 0.312,
    residualError: 4.92,
    status: 'outlier',
  },
  {
    id: 'PT_005',
    movingX: 4450.6,
    movingY: 9220.7,
    refX: 2225.3,
    refY: 4610.35,
    lat: "89°32'54.2\" S",
    lon: "132°04'59.0\" E",
    confidence: 0.977,
    residualError: 0.51,
    status: 'inlier',
  },
  {
    id: 'PT_006',
    movingX: 4510.3,
    movingY: 9340.8,
    refX: 2255.15,
    refY: 4670.4,
    lat: "89°32'58.0\" S",
    lon: "132°05'12.3\" E",
    confidence: 0.952,
    residualError: 0.73,
    status: 'inlier',
  },
  {
    id: 'PT_007',
    movingX: 3820.5,
    movingY: 8400.1,
    refX: 1910.25,
    refY: 4200.05,
    lat: "89°32'18.4\" S",
    lon: "132°02'40.5\" E",
    confidence: 0.284,
    residualError: 8.42,
    status: 'outlier',
  },
];

export const SAMPLE_EXPERIMENTS: ExperimentRecord[] = [
  {
    id: 'EXP-042',
    timestamp: '2024-10-24 14:32',
    target: 'Shackleton Crater Rim',
    sensor: 'LROC NAC L/R (89.9°S)',
    algorithm: 'RIFT2 (Phase Congruency)',
    inliers: 387,
    totalMatches: 512,
    inlierRatio: 75.6,
    rmse: 0.42,
    coverage: 82.4,
    status: 'COMPLETE',
    score: 86,
    seed: '0x8849E2',
  },
  {
    id: 'EXP-041',
    timestamp: '2024-10-24 11:15',
    target: 'Malapert Mountain Plain',
    sensor: 'TMC-2 / OHRC (86.1°S)',
    algorithm: 'LoFTR (Transformer)',
    inliers: 402,
    totalMatches: 531,
    inlierRatio: 75.7,
    rmse: 0.39,
    coverage: 84.6,
    status: 'COMPLETE',
    score: 89,
    seed: '0x7721A0',
  },
  {
    id: 'EXP-040',
    timestamp: '2024-10-23 18:40',
    target: 'Tycho Central Peak',
    sensor: 'LROC NAC (43.3°S)',
    algorithm: 'SIFT (Scale-Invariant)',
    inliers: 132,
    totalMatches: 210,
    inlierRatio: 62.8,
    rmse: 1.24,
    coverage: 54.2,
    status: 'DRIFT',
    score: 58,
    seed: '0x442B91',
  },
  {
    id: 'EXP-039',
    timestamp: '2024-10-23 16:02',
    target: 'Mare Tranquillitatis',
    sensor: 'Apollo-17 / LROC (8.5°N)',
    algorithm: 'SuperPoint + SuperGlue',
    inliers: 360,
    totalMatches: 480,
    inlierRatio: 75.0,
    rmse: 0.51,
    coverage: 78.1,
    status: 'VALIDATED',
    score: 82,
    seed: '0x331E44',
  },
  {
    id: 'EXP-038',
    timestamp: '2024-10-22 09:12',
    target: 'Oceanus Procellarum',
    sensor: 'Synthetic Shadow Test (18.4°N)',
    algorithm: 'SIFT (Raw Baseline)',
    inliers: 38,
    totalMatches: 195,
    inlierRatio: 19.4,
    rmse: 3.82,
    coverage: 21.0,
    status: 'UNMET',
    score: 24,
    seed: '0x110A88',
  },
];

export const SAMPLE_BENCHMARKS: BenchmarkMethod[] = [
  {
    name: 'VYOM DRISHTI Adaptive Orchestrator (Ours)',
    citation: 'Team Vyom Drishti, 2024',
    featureType: 'Hybrid PC-LoFTR + Epipolar Mask',
    totalMatches: 544,
    inliers: 425,
    inlierRatio: 78.1,
    rmse: 0.36,
    spatialCoverage: 88.2,
    latencySeconds: 3.84,
    vramUsageMB: 680,
    status: 'OPTIMAL (PASS)',
    statusType: 'success',
    description:
      'Dynamically segments tile into Shadowed (Phase Congruency) vs Smooth High-Albedo regions using local Shannon entropy.',
  },
  {
    name: 'RIFT2 (Phase Congruency)',
    citation: 'Li et al., 2020',
    featureType: 'Phase Congruency (EO Frequency)',
    totalMatches: 512,
    inliers: 387,
    inlierRatio: 75.6,
    rmse: 0.42,
    spatialCoverage: 82.4,
    latencySeconds: 4.12,
    vramUsageMB: 340,
    status: 'SUCCESS (PASS)',
    statusType: 'success',
    description:
      'Log-Gabor frequency analysis is invariant to solar illumination disparities up to >80° incidence.',
  },
  {
    name: 'LoFTR (Semi-Dense Transformer)',
    citation: 'Sun et al., 2021',
    featureType: 'Detector-Free ResNet-FPN',
    totalMatches: 531,
    inliers: 402,
    inlierRatio: 75.7,
    rmse: 0.39,
    spatialCoverage: 84.6,
    latencySeconds: 6.2,
    vramUsageMB: 1800,
    status: 'SUCCESS (PASS)',
    statusType: 'success',
    description:
      'Resolves correspondences across low-frequency regolith plains using cross-attention transformers.',
  },
  {
    name: 'SuperPoint + SuperGlue',
    citation: 'Sarlin et al., 2020',
    featureType: 'Learned Attentional GNN',
    totalMatches: 480,
    inliers: 360,
    inlierRatio: 75.0,
    rmse: 0.51,
    spatialCoverage: 78.1,
    latencySeconds: 5.3,
    vramUsageMB: 1200,
    status: 'SUCCESS (PASS)',
    statusType: 'success',
    description:
      'Deep learned keypoint extractor with graph neural network matching.',
  },
  {
    name: 'Classical SIFT Baseline',
    citation: 'Lowe, 2004',
    featureType: 'DoG Gradient Orientation',
    totalMatches: 210,
    inliers: 132,
    inlierRatio: 62.8,
    rmse: 1.24,
    spatialCoverage: 54.2,
    latencySeconds: 1.21,
    vramUsageMB: 120,
    status: 'MARGINAL',
    statusType: 'marginal',
    description:
      'Degrades heavily when illumination offset exceeds 15°, causing shadow drift along crater rims.',
  },
  {
    name: 'ORB Fast Tracker',
    citation: 'Rublee et al., 2011',
    featureType: 'FAST + BRIEF (Binary)',
    totalMatches: 195,
    inliers: 38,
    inlierRatio: 19.4,
    rmse: 4.18,
    spatialCoverage: 21.0,
    latencySeconds: 1.2,
    vramUsageMB: 80,
    status: 'REJECTED (>2.0px)',
    statusType: 'fail',
    description:
      'Severely fails on smooth lunar regolith and dynamic shadowed terrain.',
  },
];
