class DatabaseForm extends React.Component {
  submitForm = (e) => {
    $.ajax({
      url: '/saveDBConfig',
      type: 'post',
      data: $('#dbInfo').serialize(),
      success: function () {
        location.reload();
      }
    });
    e.preventDefault();
  }

  render() {
    return (
      <div id="databaseForm" className="modal" role="dialog">
        <div className="modal-dialog" role="document">
          <div className="modal-content">
            <form className="px-2" id="dbInfo" onSubmit={(e) => {this.submitForm(e)}}>
              <div className="modal-header">
                <h5 className="modal-title">Switch Database</h5>
                <button type="button" className="close" data-dismiss="modal" aria-label="Close">
                  <span aria-hidden="true">&times;</span>
                </button>
              </div>
              <div className="modal-body">
                <div className="form-group row">
                  <label className="col-sm-2 col-form-label">Host</label>
                  <div className="col-sm-10">
                    <input type="text" className="form-control" name="host" placeholder="pandeagle.csse.rose-hulman.edu" required />
                  </div>
                </div>
                <div className="form-group row">
                  <label className="col-sm-2 col-form-label">Port</label>
                  <div className="col-sm-10">
                    <input type="number" className="form-control" name="port" placeholder="5432" required />
                  </div>
                </div>
                <div className="form-group row">
                  <label className="col-sm-2 col-form-label">Database</label>
                  <div className="col-sm-10">
                    <input type="text" className="form-control" name="database" placeholder="pandelephant" required />
                  </div>
                </div>
                <div className="form-group row">
                  <label className="col-sm-2 col-form-label">Username</label>
                  <div className="col-sm-10">
                    <input type="text" className="form-control" name="username" placeholder="shenx" required />
                  </div>
                </div>
                <div className="form-group row">
                  <label className="col-sm-2 col-form-label">Password</label>
                  <div className="col-sm-10">
                    <input type="text" className="form-control" name="password" placeholder="123456" required />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="submit" className="btn btn-primary">Save changes</button>
                <button type="button" className="btn btn-secondary" data-dismiss="modal">Close</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    )
  }
}