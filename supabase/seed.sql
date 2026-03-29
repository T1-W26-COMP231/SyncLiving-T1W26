-- Seed lifestyle_dimensions
INSERT INTO public.lifestyle_dimensions (id, label, description, icon_name, display_order)
VALUES 
  ('social',   'Social Density', 'How often do you have guests over?', 'Users', 1),
  ('acoustic', 'Acoustic Environment', 'Typical noise level at home', 'Volume2', 2),
  ('sanitary', 'Sanitary Standards', 'Cleanliness & tidiness level', 'Sparkles', 3),
  ('rhythm',   'Circadian Rhythm', 'Sleep & daily activity schedule', 'Clock', 4),
  ('boundary', 'Boundary Philosophy', 'How you treat shared spaces & items', 'Shield', 5)
ON CONFLICT (id) DO UPDATE 
SET label = EXCLUDED.label, description = EXCLUDED.description, icon_name = EXCLUDED.icon_name, display_order = EXCLUDED.display_order;

-- Seed lifestyle_options
INSERT INTO public.lifestyle_options (dimension_id, tag, label, value)
VALUES
  -- social
  ('social', 'TheHermit',      'The Hermit',       0.1),
  ('social', 'QuietLiving',    'Quiet Living',     0.3),
  ('social', 'BalancedSocial', 'Balanced Social',  0.5),
  ('social', 'FrequentHost',   'Frequent Host',    0.7),
  ('social', 'OpenHouse',      'Open House',       0.9),
  -- acoustic
  ('acoustic', 'LibraryZone', 'Library Zone',  0.1),
  ('acoustic', 'QuietFocus',  'Quiet Focus',   0.3),
  ('acoustic', 'AmbientLife', 'Ambient Life',  0.5),
  ('acoustic', 'VibrantHome', 'Vibrant Home',  0.7),
  ('acoustic', 'HighDecibel', 'High Decibel',  0.9),
  -- sanitary
  ('sanitary', 'ChaosLover',      'Chaos Lover',       0.1),
  ('sanitary', 'LifeOverLaundry', 'Life Over Laundry', 0.3),
  ('sanitary', 'AverageTidy',     'Average Tidy',      0.5),
  ('sanitary', 'PubliclyTidy',    'Publicly Tidy',     0.7),
  ('sanitary', 'Minimalist24_7',  'Minimalist 24/7',   0.9),
  -- rhythm
  ('rhythm', 'StrictEarlyBird', 'Strict Early Bird', 0.1),
  ('rhythm', 'AM_Routine',      'AM Routine',        0.3),
  ('rhythm', 'The9to5er',       'The 9 to 5er',      0.5),
  ('rhythm', 'TheLateShifter',  'The Late Shifter',  0.7),
  ('rhythm', 'TrueNightOwl',    'True Night Owl',    0.9),
  -- boundary
  ('boundary', 'StrictlyPrivate',    'Strictly Private',     0.1),
  ('boundary', 'RespectfulDistance', 'Respectful Distance',  0.3),
  ('boundary', 'Borrower',           'Borrower',             0.5),
  ('boundary', 'SharedHousehold',    'Shared Household',     0.7),
  ('boundary', 'CommunalLiving',     'Communal Living',      0.9)
ON CONFLICT (dimension_id, tag) DO UPDATE
SET label = EXCLUDED.label, value = EXCLUDED.value;

-- Seed Lifestyle Tags
INSERT INTO public.lifestyle_tags (name, category) VALUES
    ('#EarlyRiser', 'Daily Routine'),
    ('#NightOwl', 'Daily Routine'),
    ('#RemoteWork', 'Daily Routine'),
    ('#StudentLife', 'Daily Routine'),
    ('#Tidy', 'Cleanliness'),
    ('#DeepCleaner', 'Cleanliness'),
    ('#Minimalist', 'Cleanliness'),
    ('#NonSmoker', 'Cleanliness'),
    ('#Quiet', 'Social/Noise'),
    ('#Social', 'Social/Noise'),
    ('#IntrovertFriendly', 'Social/Noise'),
    ('#OccasionalGuests', 'Social/Noise'),
    ('#PetFriendly', 'Preferences'),
    ('#LGBTQ+Friendly', 'Preferences'),
    ('#VeganFriendly', 'Preferences'),
    ('#AlcoholFree', 'Preferences')
ON CONFLICT (name) DO NOTHING;

-- Seed Amenities
INSERT INTO public.amenities (name, category) VALUES
    ('High-Speed WiFi', 'Utilities'),
    ('In-suite Laundry', 'Essentials'),
    ('Kitchen Access', 'Essentials'),
    ('Utilities Included', 'Utilities'),
    ('Air Conditioning', 'Comfort'),
    ('Private Bathroom', 'Comfort'),
    ('Furnished Room', 'Comfort'),
    ('Gym Access', 'Building'),
    ('Parking Spot', 'Exterior'),
    ('Near Transit/Subway', 'Exterior'),
    ('Bicycle Storage', 'Exterior'),
    ('Balcony/Backyard', 'Exterior')
ON CONFLICT (name) DO NOTHING;

-- Seed Room Types
INSERT INTO public.room_types (name) VALUES
    ('Private Room'),
    ('Shared Room'),
    ('Entire Apartment'),
    ('Studio')
ON CONFLICT (name) DO NOTHING;

-- Seed Review Criteria
INSERT INTO public.review_criteria (label, category, display_order) VALUES
    -- Lifestyle
    ('Common Area Cleanliness', 'Lifestyle', 1),
    ('Kitchen Hygiene', 'Lifestyle', 2),
    ('Bathroom Etiquette', 'Lifestyle', 3),
    ('Garbage Disposal', 'Lifestyle', 4),
    ('Odor Control', 'Lifestyle', 5),
    ('Daytime Noise Level', 'Lifestyle', 6),
    ('Nighttime Quietness', 'Lifestyle', 7),
    ('Energy/Water Saving', 'Lifestyle', 8),
    -- Communication & Social
    ('Friendliness', 'Social', 9),
    ('Respect for Privacy', 'Social', 10),
    ('Communication Efficiency', 'Social', 11),
    ('Conflict Resolution', 'Social', 12),
    ('Guest Policy Compliance', 'Social', 13),
    ('Borrowing Etiquette', 'Social', 14),
    -- Financials & Responsibility
    ('Rent Punctuality', 'Financial', 15),
    ('Utility Bill Payment', 'Financial', 16),
    ('Shared Supplies Contribution', 'Financial', 17),
    ('Security Awareness', 'Responsibility', 18),
    -- General
    ('Honesty & Reliability', 'General', 19),
    ('Overall Compatibility', 'General', 20)
ON CONFLICT DO NOTHING;
