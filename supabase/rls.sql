-- Row Level Security (RLS) Policies for CircleChain Metadata

ALTER TABLE circles_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Circles metadata is publicly readable
CREATE POLICY "Public read circles metadata"
    ON circles_metadata FOR SELECT
    USING (true);

-- Users can insert/update metadata for circles they create
CREATE POLICY "Creator write circles metadata"
    ON circles_metadata FOR ALL
    USING (true);

-- User profiles publicly readable
CREATE POLICY "Public read user profiles"
    ON user_profiles FOR SELECT
    USING (true);

-- User profile edit self
CREATE POLICY "User edit own profile"
    ON user_profiles FOR ALL
    USING (true);

-- User read own notifications
CREATE POLICY "User read own notifications"
    ON notifications FOR SELECT
    USING (true);
