-- Phone-only citizens: move synthetic email domain to @beiraewawa.com
-- Login by phone is unchanged; optional legacy @phone.beira.gov.mz login is handled in auth-options.

UPDATE "users"
SET "email" = REPLACE("email", '@phone.beira.gov.mz', '@beiraewawa.com')
WHERE "email" LIKE '%@phone.beira.gov.mz';
