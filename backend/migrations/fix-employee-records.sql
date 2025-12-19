-- Create employee records for users who don't have one
DO $$
DECLARE
    user_record RECORD;
    emp_count INTEGER;
    emp_code VARCHAR(20);
BEGIN
    -- Get count of existing employees
    SELECT COUNT(*) INTO emp_count FROM employees;
    
    -- Loop through users without employee records
    FOR user_record IN 
        SELECT u.id, u.role 
        FROM users u 
        LEFT JOIN employees e ON u.id = e.user_id 
        WHERE e.id IS NULL AND (u.role = 'employee' OR u.role = 'manager')
    LOOP
        -- Generate employee code
        emp_count := emp_count + 1;
        emp_code := 'EMP' || LPAD(emp_count::TEXT, 4, '0');
        
        -- Create employee record
        INSERT INTO employees (user_id, employee_code, status, created_at, updated_at)
        VALUES (user_record.id, emp_code, 'active', NOW(), NOW());
        
        RAISE NOTICE 'Created employee record for user_id: % with code: %', user_record.id, emp_code;
    END LOOP;
END $$;
