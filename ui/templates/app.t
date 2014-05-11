<div class="container">
    <div class="row">
        <div class="users col-lg-offset-2 col-lg-3 col-md-offset-1 col-md-4 col-sm-5">
            <a href="#" class="user" data-role="new-pm">
                + Message User
            </a>
            <div repeat="users"
                 class="user"
                 data-user="{{id}}">
                <small class="pull-right">
                    <em>
                        {{latestMessageTimeFromNow}}
                    </em>
                </small>
                {{id}}
                <div>
                    {{latestMessage}}
                </div>
            </div>
        </div>
        <div class="messages col-lg-5 col-md-6 col-sm-7">
            <div repeat="messages">
                <small>
                    <em>
                        {{fromNow}}
                    </em>
                </small>
                <br>
                {{message}}
                <br>
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
                    <button class="btn btn-primary btn-block"
                            type="submit">
                        Send
                    </button>
                </div>
            </form>
        </div>
    </div>
</div>