module Api
  class EmployeesController < ApplicationController
    MAX_IMPORT_BYTES = 5.megabytes

    def index
      page = Pagination.new(EmployeeSearch.new(params).call, page: params[:page], per_page: params[:per_page])
      render json: { data: page.records.map { |employee| EmployeeSerializer.call(employee) }, meta: page.meta }
    end

    def show
      render json: EmployeeSerializer.with_history(employee)
    end

    def create
      new_employee = Employee.new(employee_params)
      if new_employee.save
        render json: EmployeeSerializer.call(new_employee), status: :created
      else
        render_validation_errors(new_employee)
      end
    end

    def update
      if employee.update(employee_params)
        render json: EmployeeSerializer.call(employee)
      else
        render_validation_errors(employee)
      end
    end

    def destroy
      employee.destroy!
      head :no_content
    end

    def export
      csv = EmployeeCsv::Export.new(EmployeeSearch.new(params).call).call
      send_data csv, type: "text/csv", filename: "employees-#{Date.current.iso8601}.csv"
    end

    def import
      file = params.require(:file)
      if file.size > MAX_IMPORT_BYTES
        return render json: { error: "File is larger than #{MAX_IMPORT_BYTES / 1.megabyte} MB" }, status: :content_too_large
      end

      render json: EmployeeCsv::Import.new(file.read.force_encoding("UTF-8")).call.to_h
    end

    private

    def employee
      @employee ||= Employee.find(params[:id])
    end

    def employee_params
      params.require(:employee).permit(:employee_code, :first_name, :last_name, :email, :job_title, :department,
                                       :country_code, :salary, :employment_type, :hire_date, :salary_change_reason)
    end

    def render_validation_errors(record)
      render json: { errors: record.errors.to_hash }, status: :unprocessable_content
    end
  end
end
