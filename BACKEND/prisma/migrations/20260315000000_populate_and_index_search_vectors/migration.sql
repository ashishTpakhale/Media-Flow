-- Create GIN Indexes for Fast Full-Text Search
CREATE INDEX IF NOT EXISTS "video_search_vector_gin_idx" ON "Video" USING GIN ("searchVector");
CREATE INDEX IF NOT EXISTS "user_search_vector_gin_idx" ON "User" USING GIN ("searchVector");

-- Trigger function for Video searchVector
CREATE OR REPLACE FUNCTION update_video_search_vector() RETURNS trigger AS $$
BEGIN
  NEW."searchVector" := setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
                        setweight(to_tsvector('english', coalesce(NEW.description, '')), 'B');
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_video_search_vector ON "Video";
CREATE TRIGGER trg_video_search_vector
BEFORE INSERT OR UPDATE OF title, description ON "Video"
FOR EACH ROW EXECUTE FUNCTION update_video_search_vector();

-- Trigger function for User searchVector
CREATE OR REPLACE FUNCTION update_user_search_vector() RETURNS trigger AS $$
BEGIN
  NEW."searchVector" := setweight(to_tsvector('english', coalesce(NEW.username, '')), 'A') ||
                        setweight(to_tsvector('english', coalesce(NEW."displayName", '')), 'A') ||
                        setweight(to_tsvector('english', coalesce(NEW.bio, '')), 'B');
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_user_search_vector ON "User";
CREATE TRIGGER trg_user_search_vector
BEFORE INSERT OR UPDATE OF username, "displayName", bio ON "User"
FOR EACH ROW EXECUTE FUNCTION update_user_search_vector();

-- Backfill existing records
UPDATE "Video"
SET "searchVector" = setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
                     setweight(to_tsvector('english', coalesce(description, '')), 'B')
WHERE "searchVector" IS NULL;

UPDATE "User"
SET "searchVector" = setweight(to_tsvector('english', coalesce(username, '')), 'A') ||
                     setweight(to_tsvector('english', coalesce("displayName", '')), 'A') ||
                     setweight(to_tsvector('english', coalesce(bio, '')), 'B')
WHERE "searchVector" IS NULL;
