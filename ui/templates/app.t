<div class="container">
    <div class="row">
        <div class="users col-lg-offset-2 col-lg-3 col-md-offset-1 col-md-4 col-sm-5"
             data-role="user-container">
            <a href="#" class="user" data-role="new-pm">
                + Message User
            </a>
            <div repeat="this.users"
                 class="user"
                 data-user="{{this.id}}">
                <small class="pull-right">
                    <em>
                        {{this.message.fromNow}}
                    </em>
                </small>
                {{this.id}}
                <div>
                    {{this.message.message}}
                </div>
            </div>
        </div>
        <div class="messages col-lg-5 col-md-6 col-sm-7">
            <div repeat="this.messages" class="{{this.direction}}">
                <small>
                    <em>
                        {{this.fromNow}}
                    </em>
                </small>
                {{=this.message}}
            </div>
        </div>
    </div>
    <div class="row">
        <div class="say col-lg-offset-5 col-lg-5 col-md-offset-5 col-md-6 col-sm-offset-5 col-sm-7">
            <form>
                <div class="form-group">
                    <input class="form-control" type="text">
                    <textarea id="message"
                              class="form-control"
                              autofocus></textarea>
                </div>
            </form>
        </div>
    </div>
</div>