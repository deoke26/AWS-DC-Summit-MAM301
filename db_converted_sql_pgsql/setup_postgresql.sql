-- PostgreSQL setup script for ContosoUniversity
-- Run: psql -d postgres -f setup_postgresql.sql

-- Create database
DROP DATABASE IF EXISTS "ContosoUniversity";
CREATE DATABASE "ContosoUniversity";

\c ContosoUniversity

-- ============================================================
-- Create Tables
-- ============================================================

-- Person table (TPH: Student and Instructor share this table)
CREATE TABLE "Person" (
    "ID" SERIAL PRIMARY KEY,
    "LastName" VARCHAR(50) NOT NULL,
    "FirstName" VARCHAR(50) NOT NULL,
    "Discriminator" VARCHAR(13) NOT NULL,
    "EnrollmentDate" TIMESTAMP WITHOUT TIME ZONE,
    "HireDate" TIMESTAMP WITHOUT TIME ZONE
);

-- Department table
CREATE TABLE "Department" (
    "DepartmentID" SERIAL PRIMARY KEY,
    "Name" VARCHAR(50) NOT NULL,
    "Budget" NUMERIC(18,2) NOT NULL,
    "StartDate" TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    "InstructorID" INTEGER,
    CONSTRAINT "FK_Department_Person_InstructorID" FOREIGN KEY ("InstructorID")
        REFERENCES "Person" ("ID") ON DELETE SET NULL
);

-- Course table
CREATE TABLE "Course" (
    "CourseID" INTEGER PRIMARY KEY,
    "Title" VARCHAR(50) NOT NULL,
    "Credits" INTEGER NOT NULL,
    "DepartmentID" INTEGER NOT NULL,
    "TeachingMaterialImagePath" VARCHAR(255),
    CONSTRAINT "FK_Course_Department_DepartmentID" FOREIGN KEY ("DepartmentID")
        REFERENCES "Department" ("DepartmentID") ON DELETE CASCADE
);

-- Enrollment table
CREATE TABLE "Enrollment" (
    "EnrollmentID" SERIAL PRIMARY KEY,
    "CourseID" INTEGER NOT NULL,
    "StudentID" INTEGER NOT NULL,
    "Grade" INTEGER,
    CONSTRAINT "FK_Enrollment_Course_CourseID" FOREIGN KEY ("CourseID")
        REFERENCES "Course" ("CourseID") ON DELETE CASCADE,
    CONSTRAINT "FK_Enrollment_Person_StudentID" FOREIGN KEY ("StudentID")
        REFERENCES "Person" ("ID") ON DELETE CASCADE
);

-- OfficeAssignment table
CREATE TABLE "OfficeAssignment" (
    "InstructorID" INTEGER PRIMARY KEY,
    "Location" VARCHAR(50),
    CONSTRAINT "FK_OfficeAssignment_Person_InstructorID" FOREIGN KEY ("InstructorID")
        REFERENCES "Person" ("ID") ON DELETE CASCADE
);

-- CourseAssignment table (composite key)
CREATE TABLE "CourseAssignment" (
    "CourseID" INTEGER NOT NULL,
    "InstructorID" INTEGER NOT NULL,
    PRIMARY KEY ("CourseID", "InstructorID"),
    CONSTRAINT "FK_CourseAssignment_Course_CourseID" FOREIGN KEY ("CourseID")
        REFERENCES "Course" ("CourseID") ON DELETE CASCADE,
    CONSTRAINT "FK_CourseAssignment_Person_InstructorID" FOREIGN KEY ("InstructorID")
        REFERENCES "Person" ("ID") ON DELETE CASCADE
);

-- Notification table
CREATE TABLE "Notification" (
    "Id" SERIAL PRIMARY KEY,
    "EntityType" VARCHAR(100) NOT NULL,
    "EntityId" VARCHAR(50) NOT NULL,
    "Operation" VARCHAR(20) NOT NULL,
    "Message" VARCHAR(256) NOT NULL,
    "CreatedAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    "CreatedBy" VARCHAR(100),
    "IsRead" BOOLEAN NOT NULL DEFAULT FALSE,
    "ReadAt" TIMESTAMP WITHOUT TIME ZONE
);

-- ============================================================
-- Create Indexes
-- ============================================================

CREATE INDEX "IX_Person_Discriminator" ON "Person" ("Discriminator");
CREATE INDEX "IX_Department_InstructorID" ON "Department" ("InstructorID");
CREATE INDEX "IX_Course_DepartmentID" ON "Course" ("DepartmentID");
CREATE INDEX "IX_Enrollment_CourseID" ON "Enrollment" ("CourseID");
CREATE INDEX "IX_Enrollment_StudentID" ON "Enrollment" ("StudentID");
CREATE INDEX "IX_CourseAssignment_InstructorID" ON "CourseAssignment" ("InstructorID");

-- ============================================================
-- Seed Data
-- ============================================================

-- Insert Students (Discriminator = 'Student')
INSERT INTO "Person" ("LastName", "FirstName", "Discriminator", "EnrollmentDate") VALUES
('Alexander', 'Carson',   'Student', '2010-09-01'),
('Alonso',    'Meredith', 'Student', '2012-09-01'),
('Anand',     'Arturo',   'Student', '2013-09-01'),
('Barzdukas', 'Gytis',    'Student', '2012-09-01'),
('Li',        'Yan',      'Student', '2012-09-01'),
('Justice',   'Peggy',    'Student', '2011-09-01'),
('Norman',    'Laura',    'Student', '2013-09-01'),
('Olivetto',  'Nino',     'Student', '2005-09-01');

-- Insert Instructors (Discriminator = 'Instructor')
INSERT INTO "Person" ("LastName", "FirstName", "Discriminator", "HireDate") VALUES
('Abercrombie', 'Kim',     'Instructor', '1995-03-11'),
('Fakhouri',    'Fadi',    'Instructor', '2002-07-06'),
('Harui',       'Roger',   'Instructor', '1998-07-01'),
('Kapoor',      'Candace', 'Instructor', '2001-01-15'),
('Zheng',       'Roger',   'Instructor', '2004-02-12');

-- Insert Departments
-- Instructor IDs: Abercrombie=9, Fakhouri=10, Harui=11, Kapoor=12, Zheng=13
INSERT INTO "Department" ("Name", "Budget", "StartDate", "InstructorID") VALUES
('English',     350000.00, '2007-09-01', 9),
('Mathematics', 100000.00, '2007-09-01', 10),
('Engineering', 350000.00, '2007-09-01', 11),
('Economics',   100000.00, '2007-09-01', 12);

-- Insert Courses
-- Department IDs: English=1, Mathematics=2, Engineering=3, Economics=4
INSERT INTO "Course" ("CourseID", "Title", "Credits", "DepartmentID") VALUES
(1050, 'Chemistry',      3, 3),
(4022, 'Microeconomics', 3, 4),
(4041, 'Macroeconomics', 3, 4),
(1045, 'Calculus',       4, 2),
(3141, 'Trigonometry',   4, 2),
(2021, 'Composition',    3, 1),
(2042, 'Literature',     4, 1);

-- Insert OfficeAssignments
INSERT INTO "OfficeAssignment" ("InstructorID", "Location") VALUES
(10, 'Smith 17'),
(11, 'Gowan 27'),
(12, 'Thompson 304');

-- Insert CourseAssignments
INSERT INTO "CourseAssignment" ("CourseID", "InstructorID") VALUES
(1050, 12),
(1050, 11),
(4022, 13),
(4041, 13),
(1045, 10),
(3141, 11),
(2021, 9),
(2042, 9);

-- Insert Enrollments
-- Student IDs: Alexander=1, Alonso=2, Anand=3, Barzdukas=4, Li=5, Justice=6
-- Grade enum: A=0, B=1, C=2, D=3, F=4
INSERT INTO "Enrollment" ("CourseID", "StudentID", "Grade") VALUES
(1050, 1, 0),
(4022, 1, 2),
(4041, 1, 1),
(1045, 2, 1),
(3141, 2, 1),
(2021, 2, 1),
(1050, 3, NULL),
(4022, 3, 1),
(1050, 4, 1),
(2021, 5, 1),
(2042, 6, 1);

-- ============================================================
-- Verify seeded data
-- ============================================================
SELECT 'Students:' AS "Entity", COUNT(*) AS "Count" FROM "Person" WHERE "Discriminator" = 'Student'
UNION ALL
SELECT 'Instructors:', COUNT(*) FROM "Person" WHERE "Discriminator" = 'Instructor'
UNION ALL
SELECT 'Departments:', COUNT(*) FROM "Department"
UNION ALL
SELECT 'Courses:', COUNT(*) FROM "Course"
UNION ALL
SELECT 'Enrollments:', COUNT(*) FROM "Enrollment"
UNION ALL
SELECT 'CourseAssignments:', COUNT(*) FROM "CourseAssignment"
UNION ALL
SELECT 'OfficeAssignments:', COUNT(*) FROM "OfficeAssignment";
