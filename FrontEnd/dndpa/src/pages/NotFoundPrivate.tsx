import { Link } from 'react-router-dom';

import '../css/NotFound.css';

const NotFoundPrivate: React.FC = () => {
    return (
        <div className="pa-404">
            <div className="pa-404__inner">
                <div className="pa-404__code" aria-hidden="true">404 ERROR</div>

                <p className="pa-404__subtitle">
                    ERROR: Incorrect Pathway. Click Link Below To Be Redirected To Your Home Dashboard.
                </p>

                <div className="pa-404__actions">
                    <Link to="/user-dashboard">User Dashboard</Link>
                </div>
            </div>
        </div>
    );
};

export default NotFoundPrivate;
