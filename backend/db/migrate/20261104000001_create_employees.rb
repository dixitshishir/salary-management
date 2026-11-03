class CreateEmployees < ActiveRecord::Migration[8.1]
  def change
    create_table :employees do |t|
      t.string :employee_code, null: false
      t.string :first_name, null: false
      t.string :last_name, null: false
      t.string :email, null: false
      t.string :job_title, null: false
      t.string :department, null: false
      t.string :country_code, null: false, limit: 2
      # Annual base salary in whole units of the country's currency.
      # bigint because some currencies (IDR, KRW) run past 2^31 for one salary.
      t.bigint :salary, null: false
      t.string :employment_type, null: false
      t.date :hire_date, null: false
      t.timestamps
    end

    add_index :employees, :employee_code, unique: true
    add_index :employees, :email, unique: true
    # "What do we pay role X in country Y?" is the most common question.
    add_index :employees, %i[country_code job_title]
    add_index :employees, :department
    add_index :employees, :job_title
    add_index :employees, %i[last_name first_name]
    add_check_constraint :employees, "salary > 0", name: "salary_positive"
  end
end
